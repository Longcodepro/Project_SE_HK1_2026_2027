import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { TransactionRunner } from '../../../shared/domain/transaction-runner';
import { AwardLoyaltyUseCase } from '../../loyalty/application/award-loyalty.use-cases';
import { SendNotificationUseCase } from '../../notifications/application/send-notification.use-case';
import { toCustomerView } from '../../orders/application/order-view';
import { GetBillUseCase } from '../../orders/application/order-queries.use-cases';
import { renderBillText } from '../../orders/domain/bill';
import { assertTransition, OrderDetail, PaymentMethod } from '../../orders/domain/order';
import { OrderRepository } from '../../orders/domain/order.repository';
import { CardInput, Payment } from '../domain/payment';
import { PaymentGateway } from '../domain/payment.gateway';
import { PaymentRepository } from '../domain/payment.repository';

export interface PayInput {
  userId: number;
  orderId: number;
  method: PaymentMethod;
  card?: CardInput;
  idempotencyKey: string;
}

export interface PayResult {
  payment: Payment;
  order: ReturnType<typeof toCustomerView>;
}

const MAX_KEY_LENGTH = 100;

// UC22, UC23 Thanh toán. Cùng Idempotency-Key thì chỉ gọi cổng một lần (BR10).
@Injectable()
export class PayOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly award: AwardLoyaltyUseCase,
    private readonly bills: GetBillUseCase,
    private readonly notify: SendNotificationUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(input: PayInput): Promise<PayResult> {
    const key = input.idempotencyKey?.trim();
    if (!key || key.length > MAX_KEY_LENGTH) throw new BadRequestError(`Header Idempotency-Key là bắt buộc và tối đa ${MAX_KEY_LENGTH} ký tự`);

    const { payment, order, replay } = await this.tx.run(async () => {
      // Khóa dòng đơn: yêu cầu đến sau phải chờ rồi đọc lại kết quả của yêu cầu đầu (BR10)
      const locked = await this.orders.lockById(input.orderId);
      if (!locked || locked.userId !== input.userId) throw new NotFoundError('Đơn hàng không tồn tại');

      const previous = await this.payments.findByKey(key);
      if (previous) {
        if (previous.orderId !== locked.id) throw new ConflictError('Idempotency-Key này đã được dùng cho đơn khác');
        return { payment: previous, order: locked, replay: true };
      }
      if (locked.status !== 'PENDING' && locked.status !== 'PAYMENT_FAILED') {
        throw new ConflictError(`Đơn đang ở trạng thái ${locked.status}, không thanh toán được`); // BR09
      }

      const result = await this.gateway.charge({ method: input.method, amount: locked.totalAmount, orderCode: locked.orderCode, card: input.card });
      const saved = await this.payments.create({
        orderId: locked.id,
        method: input.method,
        amount: locked.totalAmount,
        status: result.success ? 'SUCCESS' : 'FAILED',
        idempotencyKey: key,
        gatewayRef: result.gatewayRef,
        cardLast4: input.method === 'CARD' ? (input.card?.number.slice(-4) ?? null) : null,
        transferRef: result.transferRef ?? null,
        expiresAt: result.expiresAt ?? null,
      });

      if (result.success) {
        assertTransition(locked.status, 'PAID');
        // BR11, BR40: cộng điểm và số ly, cấp mã thưởng nếu đạt mốc
        const { points } = await this.award.execute({ userId: locked.userId, totalAmount: locked.totalAmount, cups: locked.items.reduce((s, i) => s + i.quantity, 0) });
        await this.orders.update(locked.id, { status: 'PAID', pointsAwarded: points });
      } else {
        assertTransition(locked.status, 'PAYMENT_FAILED');
        await this.orders.update(locked.id, { status: 'PAYMENT_FAILED' });
      }
      return { payment: saved, order: (await this.orders.findById(locked.id))!, replay: false };
    });

    if (!replay && payment.status === 'SUCCESS') await this.notifySuccess(order, payment);
    return { payment: this.publicPayment(payment), order: toCustomerView(order) };
  }

  // Không trả idempotencyKey ra ngoài
  private publicPayment({ idempotencyKey: _k, ...p }: Payment) {
    return p as Payment;
  }

  // BR28, BR38: SMS một dòng ngắn, email là hóa đơn đầy đủ
  private async notifySuccess(order: OrderDetail, payment: Payment) {
    await this.notify.execute({
      userId: order.user.id,
      phone: order.user.phone,
      email: order.user.email,
      orderId: order.id,
      event: 'PAYMENT_SUCCESS',
      content: `BrewLite: đã thanh toán thành công đơn ${order.orderCode}, mã giao dịch ${payment.gatewayRef ?? payment.transferRef}. Cảm ơn bạn!`,
      emailSubject: `Hóa đơn ${order.orderCode} - BrewLite`,
      emailBody: renderBillText(this.bills.forOrder(order)),
    });
  }
}
