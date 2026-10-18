import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest, toPage } from '../../../shared/domain/page';
import { DiscountType, discountSpecError, Promotion, PromotionStatus, statusOf } from '../domain/promotion';
import { NewPromotion, PromotionPatch, PromotionRepository } from '../domain/promotion.repository';
import { ProductExistence } from '../domain/product-existence';
import { toPromotionView } from './promotion-view';

export interface CreatePromotionInput {
  code: string;
  discountType: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  maxTotalUses?: number | null;
  maxUsesPerUser?: number;
  productIds?: number[];
  startsAt: Date;
  endsAt: Date;
}

const withUsage = (p: Promotion, usedCount: number, now = new Date()) => ({
  ...toPromotionView(p),
  maxTotalUses: p.maxTotalUses,
  maxUsesPerUser: p.maxUsesPerUser,
  isActive: p.isActive,
  usedCount,
  status: statusOf(p, usedCount, now),
});

// UC56 Danh sách mã kèm số lượt đã dùng và trạng thái; lọc theo trạng thái, phân trang (BR47)
@Injectable()
export class ListPromotionsUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(filter: { status?: PromotionStatus; scope?: 'PUBLIC' | 'PERSONAL' }, page: PageRequest) {
    const now = new Date();
    // ponytail: lọc trạng thái trong bộ nhớ vì trạng thái suy ra từ lượt dùng; chuyển xuống SQL nếu số mã lên hàng chục nghìn
    const all = (await this.promotions.listWithUsage(filter.scope))
      .map(({ promotion, usedCount }) => withUsage(promotion, usedCount, now))
      .filter((p) => !filter.status || p.status === filter.status);
    const start = (page.page - 1) * page.pageSize;
    return toPage(all.slice(start, start + page.pageSize), all.length, page);
  }
}

// UC57 Tạo mã chung. Mã riêng do hệ thống cấp (BR39).
@Injectable()
export class CreatePromotionUseCase {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly products: ProductExistence,
  ) {}

  async execute(input: CreatePromotionInput) {
    const data: NewPromotion = {
      code: input.code.toUpperCase(),
      scope: 'PUBLIC',
      discountType: input.discountType,
      discountValue: input.discountValue ?? 0,
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      minOrderAmount: input.minOrderAmount ?? 0,
      maxTotalUses: input.maxTotalUses ?? null,
      maxUsesPerUser: input.maxUsesPerUser ?? 1,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      productIds: [...new Set(input.productIds ?? [])],
    };
    if (!(data.endsAt > data.startsAt)) throw new BadRequestError('Ngày kết thúc phải sau ngày bắt đầu');
    const error = discountSpecError(data);
    if (error) throw new BadRequestError(error);
    if (!(await this.products.allExist(data.productIds))) throw new NotFoundError('Có món trong danh sách không tồn tại');
    if (await this.promotions.codeExists(data.code)) throw new ConflictError('Mã khuyến mãi đã tồn tại');
    return withUsage(await this.promotions.create(data), 0);
  }
}

export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, 'code' | 'productIds'>> & { isActive?: boolean };

// UC58 Sửa mã. Mã đã có lượt dùng thì không đổi cách giảm, chỉ đổi hạn, lượt, đơn tối thiểu, bật tắt (BR48).
@Injectable()
export class UpdatePromotionUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(id: number, input: UpdatePromotionInput) {
    const current = await this.promotions.findById(id);
    if (!current) throw new NotFoundError('Mã khuyến mãi không tồn tại');
    if (current.scope === 'PERSONAL') throw new ConflictError('Mã riêng do hệ thống cấp, không sửa được');
    const used = (await this.promotions.usageCounts(id, 0)).total;

    const touchesDiscount = input.discountType !== undefined || input.discountValue !== undefined || input.maxDiscountAmount !== undefined;
    if (used > 0 && touchesDiscount) throw new ConflictError('Mã đã có lượt dùng, không đổi được cách giảm');
    if (input.maxTotalUses !== undefined && input.maxTotalUses !== null && input.maxTotalUses < used) {
      throw new BadRequestError(`Tổng lượt không được nhỏ hơn số lượt đang tính (${used})`);
    }

    const next: Promotion = { ...current, ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) } as Promotion;
    if (touchesDiscount) {
      // Đổi sang kiểu khác thì giá trị không dùng đến phải về trống
      if (input.discountType && input.discountType !== current.discountType) {
        if (input.discountType === 'FREE_DRINK' && input.discountValue === undefined) next.discountValue = 0;
        if (input.discountType !== 'PERCENT' && input.maxDiscountAmount === undefined && input.discountType === 'FIXED') next.maxDiscountAmount = null;
      }
      const error = discountSpecError(next);
      if (error) throw new BadRequestError(error);
    }
    if (!(next.endsAt > next.startsAt)) throw new BadRequestError('Ngày kết thúc phải sau ngày bắt đầu');

    const patch: PromotionPatch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    if (touchesDiscount) {
      patch.discountValue = next.discountValue;
      patch.maxDiscountAmount = next.maxDiscountAmount;
    }
    return withUsage(await this.promotions.update(id, patch), used);
  }
}

// UC59 Vô hiệu hóa, đơn cũ không đổi
@Injectable()
export class DeactivatePromotionUseCase {
  constructor(private readonly promotions: PromotionRepository) {}

  async execute(id: number) {
    const current = await this.promotions.findById(id);
    if (!current) throw new NotFoundError('Mã khuyến mãi không tồn tại');
    const updated = await this.promotions.update(id, { isActive: false });
    return withUsage(updated, (await this.promotions.usageCounts(id, 0)).total);
  }
}
