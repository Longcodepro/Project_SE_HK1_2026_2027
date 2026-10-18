import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { NotFoundError } from '../../../shared/domain/domain.error';
import { SendNotificationUseCase } from '../../notifications/application/send-notification.use-case';
import { PromotionRepository } from '../../promotions/domain/promotion.repository';
import { UserRepository } from '../../users/domain/user.repository';
import { counterOf, pointsFor, rewardsEarned } from '../domain/loyalty';
import { LoyaltyRepository } from '../domain/loyalty.repository';

const DAY = 86400000;

// BR40: mỗi khi tổng điểm (hoặc ly) vượt thêm một mốc, tự cấp một mã riêng. Số mã đã cấp luôn bằng floor(điểm / mốc).
@Injectable()
export class GrantRewardsUseCase {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly promotions: PromotionRepository,
    private readonly users: UserRepository,
    private readonly notify: SendNotificationUseCase,
  ) {}

  async execute(userId: number): Promise<void> {
    const [counters, rules, user] = await Promise.all([this.loyalty.counters(userId), this.loyalty.listActiveRules(), this.users.findById(userId)]);
    if (!counters || !user) return;
    for (const rule of rules) {
      const missing = rewardsEarned(counterOf(rule, counters), rule.threshold) - (await this.promotions.countByRuleAndUser(rule.id, userId));
      for (let i = 0; i < missing; i++) {
        const startsAt = new Date();
        const promo = await this.promotions.create({
          code: await this.uniqueCode(rule.kind === 'CUPS' ? 'C' : 'P', userId),
          scope: 'PERSONAL',
          userId,
          ruleId: rule.id,
          discountType: rule.discountType,
          discountValue: rule.discountValue,
          maxDiscountAmount: rule.maxDiscountAmount,
          minOrderAmount: rule.minOrderAmount,
          maxTotalUses: 1,
          maxUsesPerUser: 1,
          startsAt,
          endsAt: new Date(startsAt.getTime() + rule.validDays * DAY),
          productIds: rule.productIds, // sao danh sách món được tặng sang mã mới
        });
        await this.notify.execute({
          userId,
          phone: user.phone,
          event: 'REWARD_ISSUED',
          content: `BrewLite: bạn nhận được mã thưởng ${promo.code} (${rule.name}), dùng trong ${rule.validDays} ngày.`,
        });
      }
    }
  }

  private async uniqueCode(tag: string, userId: number): Promise<string> {
    for (;;) {
      const code = `RW${tag}${userId}${randomBytes(3).toString('hex').toUpperCase()}`;
      if (!(await this.promotions.codeExists(code))) return code;
    }
  }
}

// BR11, BR40: gọi khi đơn chuyển sang PAID. Trả số điểm cộng được để lưu vào Order.pointsAwarded.
@Injectable()
export class AwardLoyaltyUseCase {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly grant: GrantRewardsUseCase,
  ) {}

  async execute(input: { userId: number; totalAmount: number; cups: number }): Promise<{ points: number }> {
    const points = pointsFor(input.totalAmount, await this.loyalty.getSettings());
    if (!(await this.loyalty.counters(input.userId))) throw new NotFoundError('Không tìm thấy tài khoản');
    await this.loyalty.addCounters(input.userId, points, input.cups);
    await this.grant.execute(input.userId);
    return { points };
  }
}

// BR51: hủy đơn đã trả tiền thì thu hồi đúng số điểm và số ly của đơn; mã thưởng đã cấp không thu hồi
@Injectable()
export class RevokeLoyaltyUseCase {
  constructor(private readonly loyalty: LoyaltyRepository) {}

  execute(input: { userId: number; points: number; cups: number }) {
    return this.loyalty.subtractCounters(input.userId, input.points, input.cups);
  }
}
