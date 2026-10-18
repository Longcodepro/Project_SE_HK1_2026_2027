import { describe } from '../../promotions/domain/promotion';
import { OrderDetail, OrderItemDetail } from './order';

export interface BillLine {
  quantity: number;
  productName: string;
  sizeLabel: string;
  unitPrice: number;
  lineTotal: number;
  optionsText: string;
  toppingsText: string;
  note: string | null;
}

export interface BillView {
  orderCode: string;
  paidAt: Date;
  customerName: string;
  phoneMasked: string;
  paymentMethod: string;
  transactionCode: string | null;
  lines: BillLine[];
  subtotal: number;
  discountAmount: number;
  promotionCode: string | null;
  promotionLabel: string | null;
  totalAmount: number;
  pointsEarned: number;
  refundAmounts: number[];
  netAmount: number;
  isCancelled: boolean;
}

// Giấu giữa số điện thoại: 0922000001 -> 092****001
export const maskPhone = (phone: string) => `${phone.slice(0, 3)}****${phone.slice(-3)}`;

const sizeLabel = (i: OrderItemDetail) => (i.sizeVolumeMl ? `${i.sizeCode} · ${i.sizeVolumeMl} ml` : i.sizeCode);

const optionsText = (i: OrderItemDetail) => `${i.temperature === 'HOT' ? 'Nóng' : 'Lạnh'} · Đá ${i.iceLevel}% · Đường ${i.sugarLevel}%`;

// BR38: hóa đơn dựng từ đơn, lần thanh toán thành công và các lần hoàn tiền; không có bảng riêng.
// Mỗi dòng đơn là một dòng hóa đơn (cùng món khác tùy chỉnh thì đã là dòng đơn riêng).
export function buildBill(order: OrderDetail): BillView | null {
  const paid = order.payments.filter((p) => p.status === 'SUCCESS').sort((a, b) => b.id - a.id)[0];
  if (!paid) return null;
  const refundAmounts = order.refunds.map((r) => r.amount);
  return {
    orderCode: order.orderCode,
    paidAt: paid.createdAt,
    customerName: order.user.fullName,
    phoneMasked: maskPhone(order.user.phone),
    paymentMethod: paid.method,
    transactionCode: paid.gatewayRef ?? paid.transferRef,
    lines: order.items.map((i) => ({
      quantity: i.quantity,
      productName: i.productName,
      sizeLabel: sizeLabel(i),
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      optionsText: optionsText(i),
      toppingsText: i.toppings.map((t) => (t.quantity > 1 ? `${t.toppingName} x${t.quantity}` : t.toppingName)).join(', '),
      note: i.note,
    })),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    promotionCode: order.promotionCode,
    promotionLabel: order.promotion ? describe(order.promotion) : null,
    totalAmount: order.totalAmount,
    pointsEarned: order.pointsAwarded,
    refundAmounts,
    netAmount: order.totalAmount - refundAmounts.reduce((s, a) => s + a, 0),
    isCancelled: order.status === 'CANCELLED',
  };
}
