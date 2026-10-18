import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError, UnprocessableError } from '../../../shared/domain/domain.error';
import { TransactionRunner } from '../../../shared/domain/transaction-runner';
import { ReleaseStockUseCase } from '../../catalog/application/stock.use-cases';
import { RevokeLoyaltyUseCase } from '../../loyalty/application/award-loyalty.use-cases';
import { SendNotificationUseCase } from '../../notifications/application/send-notification.use-case';
import { ReleasePromotionUsageUseCase } from '../../promotions/application/order-promotions.use-cases';
import { RefundToWalletUseCase } from '../../wallet/application/wallet.use-cases';
import { assertTransition, generatePickupCode, isCancellable } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import { toCustomerView, toStaffView } from './order-view';

export interface CancelInput {
  orderId: number;
  actorId: number;
  byStaff: boolean;
  note?: string;
}

// UC27 khách hủy, UC36 nhân viên hủy: cùng một quy trình, khác người hủy và lý do (BR13)
@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly refund: RefundToWalletUseCase,
    private readonly revokeLoyalty: RevokeLoyaltyUseCase,
    private readonly releasePromotion: ReleasePromotionUsageUseCase,
    private readonly releaseStock: ReleaseStockUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(input: CancelInput) {
    const updated = await this.tx.run(async () => {
      const order = await this.orders.lockById(input.orderId);
      // Khách chỉ hủy được đơn của mình; đơn của người khác coi như không tồn tại
      if (!order || (!input.byStaff && order.userId !== input.actorId)) throw new NotFoundError('Đơn hàng không tồn tại');
      if (!isCancellable(order.status)) {
        throw new ConflictError(order.status === 'CANCELLED' ? 'Đơn đã được hủy trước đó' : `Đơn đang ở trạng thái ${order.status}, không thể hủy`);
      }
      const wasPaid = order.status === 'PAID';

      await this.orders.update(order.id, {
        status: 'CANCELLED',
        cancelReason: input.byStaff ? 'STAFF_CANCEL' : 'CUSTOMER_CANCEL',
        cancelledByUserId: input.actorId,
        cancelNote: input.note?.trim() || null,
      });

      if (wasPaid) {
        const payment = order.payments.filter((p) => p.status === 'SUCCESS').sort((a, b) => b.id - a.id)[0];
        if (!payment) throw new ConflictError('Đơn đã thanh toán nhưng không tìm thấy giao dịch để hoàn tiền');
        // BR16, BR43: hoàn đủ vào ví của khách
        await this.refund.execute({ orderId: order.id, paymentId: payment.id, userId: order.userId, amount: order.totalAmount, reason: 'CANCEL', actorId: input.actorId, note: input.note });
        // BR51: thu hồi đúng số điểm và số ly của đơn
        await this.revokeLoyalty.execute({ userId: order.userId, points: order.pointsAwarded, cups: order.items.reduce((s, i) => s + i.quantity, 0) });
      }
      await this.releasePromotion.execute(order.id); // BR39
      await this.releaseStock.execute(order.items.map((i) => ({ productId: i.productId, name: i.productName, quantity: i.quantity })), order.createdAt); // BR50
      return (await this.orders.findById(order.id))!;
    });
    return input.byStaff ? toStaffView(updated) : toCustomerView(updated);
  }
}

// UC34 Nhân viên chuyển PAID → PREPARING → READY. READY sinh mã nhận hàng và báo khách (BR12, BR28).
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly notify: SendNotificationUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(orderId: number, status: string) {
    const order = await this.tx.run(async () => {
      const locked = await this.orders.lockById(orderId);
      if (!locked) throw new NotFoundError('Đơn hàng không tồn tại');
      // Route này chỉ đưa đơn tới PREPARING hoặc READY; giao hàng và hủy đi đường riêng
      if (status !== 'PREPARING' && status !== 'READY') throw new ConflictError(`Không thể chuyển đơn sang ${status} bằng thao tác này`);
      assertTransition(locked.status, status);
      await this.orders.update(orderId, { status, ...(status === 'READY' && { pickupCode: await this.uniquePickupCode() }) });
      return (await this.orders.findById(orderId))!;
    });
    if (order.status === 'READY') {
      await this.notify.execute({
        userId: order.user.id,
        phone: order.user.phone,
        email: order.user.email,
        orderId: order.id,
        event: 'ORDER_READY',
        content: `BrewLite: đơn ${order.orderCode} đã xong, mã nhận hàng của bạn là ${order.pickupCode}.`,
      });
    }
    return toStaffView(order);
  }

  private async uniquePickupCode(): Promise<string> {
    for (;;) {
      const code = generatePickupCode();
      if (!(await this.orders.pickupCodeExists(code))) return code;
    }
  }
}

// UC35 Giao món: khách đưa mã, nhân viên nhập đúng 6 số để xác nhận (BR12)
@Injectable()
export class CompleteOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly notify: SendNotificationUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(orderId: number, pickupCode: string) {
    const order = await this.tx.run(async () => {
      const locked = await this.orders.lockById(orderId);
      if (!locked) throw new NotFoundError('Đơn hàng không tồn tại');
      if (locked.status !== 'READY') throw new ConflictError('Chỉ giao được đơn đã xong (READY)');
      if (locked.pickupCode !== pickupCode) throw new UnprocessableError('Mã nhận hàng không khớp');
      assertTransition(locked.status, 'COMPLETED');
      await this.orders.update(orderId, { status: 'COMPLETED' });
      return (await this.orders.findById(orderId))!;
    });
    await this.notify.execute({
      userId: order.user.id,
      phone: order.user.phone,
      email: order.user.email,
      orderId: order.id,
      event: 'ORDER_COMPLETED',
      content: `BrewLite: cảm ơn bạn đã nhận đơn ${order.orderCode}. Hẹn gặp lại!`,
    });
    return toStaffView(order);
  }
}

