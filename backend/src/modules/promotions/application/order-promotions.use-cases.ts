import { Injectable } from '@nestjs/common';
import { UnprocessableError } from '../../../shared/domain/domain.error';
import { computeDiscount, Promotion, usabilityError } from '../domain/promotion';
import { PromotionRepository } from '../domain/promotion.repository';

export interface ResolveInput {
  userId: number;
  code: string;
  subtotal: number;
  // Đơn giá từng dòng, theo thứ tự dòng trong đơn, để tìm ly được tặng
  lines: { productId: number; unitPrice: number }[];
  freeCupLine?: number;
}

// Dùng khi tạo đơn (UC18 bước 4): kiểm lại mã bằng dữ liệu thật của đơn. Phải gọi trong giao dịch tạo đơn.
@Injectable()
export class ResolvePromotionForOrderUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(input: ResolveInput): Promise<{ promotion: Promotion; discountAmount: number }> {
    const promotion = await this.promotions.findByCode(input.code.toUpperCase());
    if (!promotion) throw new UnprocessableError('Mã khuyến mãi không tồn tại');
    await this.promotions.lock(promotion.id);
    const counts = await this.promotions.usageCounts(promotion.id, input.userId);
    const error = usabilityError(promotion, { now: new Date(), userId: input.userId, subtotal: input.subtotal, counts });
    if (error) throw new UnprocessableError(error);

    let cupPrice = 0;
    if (promotion.discountType === 'FREE_DRINK') {
      if (input.freeCupLine === undefined) throw new UnprocessableError('Vui lòng chọn ly được tặng trong đơn');
      const line = input.lines[input.freeCupLine];
      if (!line) throw new UnprocessableError('Dòng được chọn làm ly tặng không tồn tại trong đơn');
      if (!promotion.productIds.includes(line.productId)) throw new UnprocessableError('Ly được chọn không thuộc danh sách món của mã này');
      cupPrice = line.unitPrice;
    }
    return { promotion, discountAmount: computeDiscount(promotion, input.subtotal, cupPrice) };
  }
}

// BR39: tính lượt ngay khi tạo đơn
@Injectable()
export class RecordPromotionUsageUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  execute(promotionId: number, userId: number, orderId: number) {
    return this.promotions.recordUsage(promotionId, userId, orderId);
  }
}

// BR39: đơn sang CANCELLED thì trả lại lượt. Đơn không dùng mã thì không làm gì.
@Injectable()
export class ReleasePromotionUsageUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  execute(orderId: number) {
    return this.promotions.releaseUsage(orderId);
  }
}
