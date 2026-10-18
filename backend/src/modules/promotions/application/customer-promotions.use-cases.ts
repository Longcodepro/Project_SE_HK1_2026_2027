import { Injectable } from '@nestjs/common';
import { UnprocessableError } from '../../../shared/domain/domain.error';
import { computeDiscount, describe, Promotion, usabilityError } from '../domain/promotion';
import { PromotionRepository } from '../domain/promotion.repository';
import { toPromotionView } from './promotion-view';

export interface ValidateInput {
  userId: number;
  code: string;
  subtotal: number;
  // Chỉ với mã tặng ly: thứ tự dòng khách chọn làm ly được tặng, món của dòng đó và giá ly để xem trước số tiền giảm
  pickedCup?: number;
  pickedProductId?: number;
  cupPrice?: number;
}

// UC19 Xem trước mã khuyến mãi. Bước kiểm chính thức nằm ở ResolvePromotionForOrderUseCase khi tạo đơn.
@Injectable()
export class ValidatePromotionUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(input: ValidateInput) {
    const promotion = await this.promotions.findByCode(input.code.toUpperCase());
    if (!promotion) throw new UnprocessableError('Mã khuyến mãi không tồn tại');
    const counts = await this.promotions.usageCounts(promotion.id, input.userId);
    const error = usabilityError(promotion, { now: new Date(), userId: input.userId, subtotal: input.subtotal, counts });
    if (error) throw new UnprocessableError(error);
    if (promotion.discountType === 'FREE_DRINK') {
      if (input.pickedCup === undefined) throw new UnprocessableError('Vui lòng chọn ly được tặng trong đơn');
      if (input.pickedProductId !== undefined && !promotion.productIds.includes(input.pickedProductId)) {
        throw new UnprocessableError('Ly được chọn không thuộc danh sách món của mã này');
      }
    }
    return { promotion: toPromotionView(promotion), discountAmount: computeDiscount(promotion, input.subtotal, input.cupPrice) };
  }
}

// UC70 Các mã của tôi: mã riêng (còn dùng, đã dùng, hết hạn) và mã chung còn hiệu lực
@Injectable()
export class ListMyVouchersUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(userId: number) {
    const now = new Date();
    const rows = await this.promotions.listForUser(userId, now);
    return rows.map(({ promotion: p, usedCount, usedByUser }) => {
      const exhausted = p.maxTotalUses !== null && usedCount >= p.maxTotalUses;
      const isUsable = p.isActive && now >= p.startsAt && now <= p.endsAt && !exhausted && usedByUser < p.maxUsesPerUser;
      return {
        code: p.code,
        scope: p.scope,
        label: describe(p),
        expiresAt: p.endsAt,
        isUsable,
        discountType: p.discountType,
        minOrderAmount: p.minOrderAmount,
        productIds: p.productIds,
      };
    });
  }
}

export type { Promotion };
