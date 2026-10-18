import { DiscountType, Promotion, PromotionScope, UsageCounts } from './promotion';

export interface NewPromotion {
  code: string;
  scope: PromotionScope;
  userId?: number | null;
  ruleId?: number | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  maxTotalUses: number | null;
  maxUsesPerUser: number;
  startsAt: Date;
  endsAt: Date;
  productIds: number[];
}

export type PromotionPatch = Partial<Omit<NewPromotion, 'code' | 'scope' | 'userId' | 'ruleId' | 'productIds'>> & { isActive?: boolean };

export interface PromotionWithUsage {
  promotion: Promotion;
  usedCount: number;
}

export abstract class PromotionRepository {
  abstract findByCode(code: string): Promise<Promotion | null>;
  abstract findById(id: number): Promise<Promotion | null>;
  abstract create(data: NewPromotion): Promise<Promotion>;
  abstract update(id: number, patch: PromotionPatch): Promise<Promotion>;
  abstract listWithUsage(scope?: PromotionScope): Promise<PromotionWithUsage[]>;
  // Mã dành cho khách: mã riêng của họ và mã chung còn hiệu lực, kèm số lần họ đã dùng
  abstract listForUser(userId: number, now: Date): Promise<(PromotionWithUsage & { usedByUser: number })[]>;
  // Khóa dòng mã để kiểm lượt dùng không bị hai đơn đồng thời vượt qua cùng lúc (BR53)
  abstract lock(id: number): Promise<void>;
  abstract usageCounts(promotionId: number, userId: number): Promise<UsageCounts>;
  abstract recordUsage(promotionId: number, userId: number, orderId: number): Promise<void>;
  abstract releaseUsage(orderId: number): Promise<void>;
  abstract countByRuleAndUser(ruleId: number, userId: number): Promise<number>;
  abstract codeExists(code: string): Promise<boolean>;
}
