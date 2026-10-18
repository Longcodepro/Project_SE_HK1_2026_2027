import { Injectable } from '@nestjs/common';
import { BadRequestError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { discountSpecError } from '../../promotions/domain/promotion';
import { ProductExistence } from '../../promotions/domain/product-existence';
import { counterOf, remainingToNext, RewardKind, RewardRule } from '../domain/loyalty';
import { LoyaltyRepository, RulePatch } from '../domain/loyalty.repository';

const nextRewards = (rules: RewardRule[], c: { loyaltyPoints: number; totalCups: number }) =>
  rules.map((r) => ({ ruleId: r.id, name: r.name, kind: r.kind, threshold: r.threshold, current: counterOf(r, c), remaining: remainingToNext(counterOf(r, c), r.threshold) }));

// UC29 Điểm của tôi: điểm, số ly và còn thiếu bao nhiêu tới mốc thưởng kế tiếp
@Injectable()
export class GetMyPointsUseCase {
  constructor(private readonly loyalty: LoyaltyRepository) {}

  async execute(userId: number) {
    const [counters, settings, rules] = await Promise.all([this.loyalty.counters(userId), this.loyalty.getSettings(), this.loyalty.listActiveRules()]);
    if (!counters) throw new NotFoundError('Không tìm thấy tài khoản');
    return { points: counters.loyaltyPoints, totalCups: counters.totalCups, ...settings, nextRewards: nextRewards(rules, counters) };
  }
}

// UC63 Quản lý xem điểm của khách: chỉ xem, không sửa
@Injectable()
export class GetUserPointsUseCase {
  constructor(private readonly loyalty: LoyaltyRepository) {}

  async execute(userId: number) {
    const counters = await this.loyalty.counters(userId);
    if (!counters) throw new NotFoundError('Không tìm thấy tài khoản');
    const vouchers = await this.loyalty.voucherStats(userId, new Date());
    return { points: counters.loyaltyPoints, totalCups: counters.totalCups, rewardsGranted: vouchers.granted, rewardsUsable: vouchers.usable };
  }
}

// UC69 Tỉ lệ tích điểm
@Injectable()
export class LoyaltySettingsUseCases {
  constructor(private readonly loyalty: LoyaltyRepository) {}

  get() {
    return this.loyalty.getSettings();
  }

  // Chỉ áp dụng cho đơn thanh toán từ lúc đổi; điểm đã cấp không tính lại
  update(patch: { amountStep?: number; pointsPerStep?: number }) {
    return this.loyalty.updateSettings(patch);
  }
}

export interface CreateRuleInput {
  name: string;
  kind: RewardKind;
  threshold: number;
  discountType: RewardRule['discountType'];
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  validDays: number;
  productIds?: number[];
}

// UC69 Quy tắc thưởng
@Injectable()
export class RewardRulesUseCases {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly products: ProductExistence,
  ) {}

  list(page: PageRequest) {
    return this.loyalty.listRules(page);
  }

  async create(input: CreateRuleInput) {
    const data = {
      name: input.name,
      kind: input.kind,
      threshold: input.threshold,
      discountType: input.discountType,
      discountValue: input.discountValue ?? 0,
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      minOrderAmount: input.minOrderAmount ?? 0,
      validDays: input.validDays,
      productIds: [...new Set(input.productIds ?? [])],
    };
    const error = discountSpecError(data);
    if (error) throw new BadRequestError(error);
    if (!(await this.products.allExist(data.productIds))) throw new NotFoundError('Có món trong danh sách không tồn tại');
    return this.loyalty.createRule(data);
  }

  async update(id: number, patch: RulePatch) {
    const current = await this.mustFind(id);
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as RulePatch;
    const next = { ...current, ...defined };
    if (defined.discountType === 'FREE_DRINK' && defined.discountValue === undefined) next.discountValue = 0;
    if (defined.discountType === 'FIXED' && defined.maxDiscountAmount === undefined) next.maxDiscountAmount = null;
    const error = discountSpecError(next);
    if (error) throw new BadRequestError(error);
    return this.loyalty.updateRule(id, { ...defined, discountValue: next.discountValue, maxDiscountAmount: next.maxDiscountAmount });
  }

  async setActive(id: number, isActive: boolean) {
    await this.mustFind(id);
    return this.loyalty.updateRule(id, { isActive });
  }

  private async mustFind(id: number) {
    const rule = await this.loyalty.findRule(id);
    if (!rule) throw new NotFoundError('Quy tắc thưởng không tồn tại');
    return rule;
  }
}
