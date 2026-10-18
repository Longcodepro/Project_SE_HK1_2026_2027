import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError, UnprocessableError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { TransactionRunner } from '../../../shared/domain/transaction-runner';
import { OrderRepository } from '../../orders/domain/order.repository';
import { GetRefundedTotalUseCase, RefundToWalletUseCase } from '../../wallet/application/wallet.use-cases';
import { ISSUE_ELIGIBLE_STATUSES, ItemResolution } from '../domain/item-issue';
import { ItemIssueRepository } from '../domain/item-issue.repository';

export interface HandleMissingItemInput {
  orderId: number;
  actorId: number;
  orderItemId: number;
  quantity: number;
  resolution: ItemResolution;
  note: string;
}

// UC74 Xử lý món không làm được: hoàn tiền món vào ví hoặc đổi món khác ngoài quầy (BR45).
// Không đổi trạng thái đơn, không trả số ly, không đổi điểm.
@Injectable()
export class HandleMissingItemUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly issues: ItemIssueRepository,
    private readonly refund: RefundToWalletUseCase,
    private readonly refundedTotal: GetRefundedTotalUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(input: HandleMissingItemInput) {
    return this.tx.run(async () => {
      const order = await this.orders.lockById(input.orderId);
      if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
      if (!ISSUE_ELIGIBLE_STATUSES.includes(order.status)) throw new ConflictError(`Đơn đang ở trạng thái ${order.status}, không xử lý món được`);

      const item = order.items.find((i) => i.id === input.orderItemId);
      if (!item) throw new UnprocessableError('Dòng món không thuộc đơn này');
      const remaining = item.quantity - (await this.issues.handledQuantity(item.id));
      if (input.quantity < 1 || input.quantity > remaining) throw new UnprocessableError(`Chỉ còn ${remaining} ly chưa xử lý ở dòng này`);

      let refundId: number | null = null;
      if (input.resolution === 'REFUND_TO_WALLET') {
        // Hoàn đơn giá ly × số ly (đã gồm topping), không chia lại khuyến mãi; tổng hoàn của đơn không vượt totalAmount
        const amount = item.unitPrice * input.quantity;
        if ((await this.refundedTotal.execute(order.id)) + amount > order.totalAmount) {
          throw new UnprocessableError('Tổng tiền hoàn của đơn không được vượt quá tổng tiền khách đã trả');
        }
        const payment = order.payments.filter((p) => p.status === 'SUCCESS').sort((a, b) => b.id - a.id)[0];
        if (!payment) throw new ConflictError('Không tìm thấy giao dịch thanh toán để hoàn tiền');
        refundId = (await this.refund.execute({ orderId: order.id, paymentId: payment.id, userId: order.userId, amount, reason: 'MISSING_ITEM', actorId: input.actorId, note: input.note })).id;
      }
      const issue = await this.issues.create({ orderId: order.id, orderItemId: item.id, quantity: input.quantity, resolution: input.resolution, refundId, note: input.note, handledByUserId: input.actorId });
      return {
        id: issue.id,
        orderId: order.id,
        orderItemId: item.id,
        quantity: input.quantity,
        resolution: input.resolution,
        refundId,
        refundAmount: refundId ? item.unitPrice * input.quantity : null,
        remainingQuantity: remaining - input.quantity,
        note: input.note,
      };
    });
  }
}

// UC74 bước 5: quản lý xem lại ai xử lý, vì sao
@Injectable()
export class ListItemIssuesUseCase {
  constructor(private readonly issues: ItemIssueRepository) {}

  execute(filter: { from?: Date; to?: Date; resolution?: ItemResolution }, page: PageRequest) {
    if (filter.from && filter.to && filter.from > filter.to) throw new BadRequestError('Ngày bắt đầu không được sau ngày kết thúc');
    return this.issues.list(filter, page);
  }
}
