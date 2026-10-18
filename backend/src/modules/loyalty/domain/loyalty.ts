import { DiscountType } from '../../promotions/domain/promotion';

export type RewardKind = 'POINTS' | 'CUPS';

export interface LoyaltySettings {
  amountStep: number;
  pointsPerStep: number;
}

export interface RewardRule {
  id: number;
  name: string;
  kind: RewardKind;
  threshold: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  validDays: number;
  isActive: boolean;
  productIds: number[];
}

// BR11: mỗi amountStep đồng được pointsPerStep điểm, tính trên số tiền khách đã trả, làm tròn xuống theo bước
export const pointsFor = (totalAmount: number, s: LoyaltySettings) => Math.floor(totalAmount / s.amountStep) * s.pointsPerStep;

// BR40: số mã thưởng khách đáng có theo mốc; số đã cấp luôn bằng giá trị này
export const rewardsEarned = (current: number, threshold: number) => Math.floor(current / threshold);

// Còn thiếu bao nhiêu tới mốc thưởng kế tiếp
export const remainingToNext = (current: number, threshold: number) => threshold - (current % threshold);

export const counterOf = (rule: Pick<RewardRule, 'kind'>, c: { loyaltyPoints: number; totalCups: number }) => (rule.kind === 'POINTS' ? c.loyaltyPoints : c.totalCups);
