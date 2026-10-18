export type DiscountType = 'PERCENT' | 'FIXED' | 'FREE_DRINK';
export type PromotionScope = 'PUBLIC' | 'PERSONAL';
export type PromotionStatus = 'upcoming' | 'active' | 'exhausted' | 'expired' | 'disabled';

export interface Promotion {
  id: number;
  code: string;
  scope: PromotionScope;
  userId: number | null;
  ruleId: number | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  maxTotalUses: number | null;
  maxUsesPerUser: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  productIds: number[];
}

export interface UsageCounts {
  total: number; // lượt đang tính của cả hệ thống (không tính lượt đã trả lại)
  byUser: number;
}

// Phần mô tả cách giảm, dùng chung cho mã khuyến mãi và quy tắc thưởng (BR07, BR40)
export interface DiscountSpec {
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  productIds: number[];
}

export const fmtMoney = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

// Trả về thông báo lỗi nếu cách giảm sai quy tắc BR07, null nếu hợp lệ
export function discountSpecError(s: DiscountSpec): string | null {
  const hasMax = s.maxDiscountAmount !== null;
  if (s.discountType === 'PERCENT') {
    if (!(s.discountValue >= 1 && s.discountValue <= 100)) return 'Mã giảm theo phần trăm phải từ 1 đến 100';
    if (!hasMax || s.maxDiscountAmount! <= 0) return 'Mã giảm theo phần trăm bắt buộc có mức giảm tối đa lớn hơn 0';
    if (s.productIds.length > 0) return 'Chỉ mã tặng ly mới có danh sách món';
  } else if (s.discountType === 'FIXED') {
    if (!(s.discountValue > 0)) return 'Số tiền giảm phải lớn hơn 0';
    if (hasMax) return 'Mã giảm tiền cố định không có mức giảm tối đa';
    if (s.productIds.length > 0) return 'Chỉ mã tặng ly mới có danh sách món';
  } else {
    if (s.discountValue !== 0) return 'Mã tặng ly không có giá trị giảm';
    if (s.productIds.length === 0) return 'Mã tặng ly phải có ít nhất một món được tặng';
    if (hasMax && s.maxDiscountAmount! <= 0) return 'Mức giảm tối đa phải lớn hơn 0';
  }
  return null;
}

export function describe(p: Pick<Promotion, 'discountType' | 'discountValue' | 'maxDiscountAmount'>): string {
  if (p.discountType === 'FIXED') return `Giảm ${fmtMoney(p.discountValue)}`;
  if (p.discountType === 'PERCENT') return `Giảm ${p.discountValue}%, tối đa ${fmtMoney(p.maxDiscountAmount ?? 0)}`;
  return p.maxDiscountAmount ? `Tặng 1 ly, tối đa ${fmtMoney(p.maxDiscountAmount)}` : 'Tặng 1 ly';
}

export function statusOf(p: Promotion, used: number, now: Date): PromotionStatus {
  if (!p.isActive) return 'disabled';
  if (now > p.endsAt) return 'expired';
  if (now < p.startsAt) return 'upcoming';
  if (p.maxTotalUses !== null && used >= p.maxTotalUses) return 'exhausted';
  return 'active';
}

// BR07, BR39: mã dùng được cho người này, với đơn này, ngay lúc này không. Trả lý do nếu không.
export function usabilityError(p: Promotion, ctx: { now: Date; userId: number; subtotal: number; counts: UsageCounts }): string | null {
  if (!p.isActive) return 'Mã khuyến mãi đã bị vô hiệu hóa';
  if (ctx.now < p.startsAt) return 'Mã khuyến mãi chưa tới thời gian áp dụng';
  if (ctx.now > p.endsAt) return 'Mã khuyến mãi đã hết hạn';
  if (p.scope === 'PERSONAL' && p.userId !== ctx.userId) return 'Mã khuyến mãi không tồn tại';
  if (ctx.subtotal < p.minOrderAmount) return `Đơn hàng cần tối thiểu ${fmtMoney(p.minOrderAmount)} để dùng mã này`;
  if (p.maxTotalUses !== null && ctx.counts.total >= p.maxTotalUses) return 'Mã khuyến mãi đã hết lượt sử dụng';
  if (ctx.counts.byUser >= p.maxUsesPerUser) return 'Bạn đã dùng hết số lần cho phép của mã này';
  return null;
}

// BR07, BR08. cupPrice: giá ly được tặng (đã gồm size và topping), chỉ dùng cho mã tặng ly.
export function computeDiscount(p: Promotion, subtotal: number, cupPrice = 0): number {
  if (p.discountType === 'FIXED') return Math.min(p.discountValue, subtotal);
  if (p.discountType === 'PERCENT') return Math.min(Math.floor((subtotal * p.discountValue) / 100), p.maxDiscountAmount ?? Infinity, subtotal);
  return Math.min(cupPrice, p.maxDiscountAmount ?? Infinity, subtotal);
}
