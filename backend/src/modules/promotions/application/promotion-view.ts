import { describe, Promotion } from '../domain/promotion';

export const toPromotionView = (p: Promotion) => ({
  id: p.id,
  code: p.code,
  scope: p.scope,
  label: describe(p),
  discountType: p.discountType,
  discountValue: p.discountValue,
  maxDiscountAmount: p.maxDiscountAmount,
  minOrderAmount: p.minOrderAmount,
  startsAt: p.startsAt,
  endsAt: p.endsAt,
  productIds: p.productIds,
});
