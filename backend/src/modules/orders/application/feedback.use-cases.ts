import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { FeedbackRepository } from '../domain/feedback.repository';
import { wordCount } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';

// UC28 Khách đánh giá đơn đã nhận: 1-5 sao, mỗi đơn một lần, không sửa (BR14)
@Injectable()
export class SubmitFeedbackUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly feedback: FeedbackRepository,
  ) {}

  async execute(userId: number, orderId: number, input: { rating: number; comment?: string }) {
    const order = await this.orders.findById(orderId);
    if (!order || order.userId !== userId) throw new NotFoundError('Đơn hàng không tồn tại');
    if (order.status !== 'COMPLETED') throw new ConflictError('Chỉ đánh giá được đơn đã nhận');
    if (order.feedback) throw new ConflictError('Đơn này đã có đánh giá');
    const comment = input.comment?.trim() || null;
    if (comment && (wordCount(comment) > 50 || comment.length > 300)) throw new BadRequestError('Nhận xét tối đa 50 từ và 300 ký tự');
    await this.feedback.create({ orderId, userId, rating: input.rating, comment });
    return { rating: input.rating, comment };
  }
}

// UC37 Nhân viên và quản lý xem phản hồi, lọc theo số sao
@Injectable()
export class ListFeedbackUseCase {
  constructor(private readonly feedback: FeedbackRepository) {}

  execute(filter: { rating?: number }, page: PageRequest) {
    return this.feedback.list(filter, page);
  }
}
