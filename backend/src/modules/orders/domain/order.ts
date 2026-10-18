import { randomInt } from 'crypto';
import { ConflictError, NotFoundError, UnprocessableError } from '../../../shared/domain/domain.error';
import { isOnMenu, Product, ProductSize, ProductTopping, SizeCode, Temperature } from '../../catalog/domain/product';

export type OrderStatus = 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type CancelReason = 'CUSTOMER_CANCEL' | 'STAFF_CANCEL';
export type PaymentMethod = 'EWALLET' | 'CARD' | 'TRANSFER';

export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'PAYMENT_FAILED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

// Các trạng thái đã trả tiền và còn hiệu lực, dùng cho thống kê và doanh thu (BR21)
export const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

// ───── Máy trạng thái đơn (BR09, BR12, BR13) ─────
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new ConflictError(`Không thể chuyển đơn từ ${from} sang ${to}`);
}

// BR13: hủy được khi chưa vào chế biến
export const isCancellable = (status: OrderStatus) => canTransition(status, 'CANCELLED');

// ───── Dữ liệu đơn ─────
export interface OrderItemDetail {
  id: number;
  productId: number;
  productName: string;
  sizeCode: SizeCode;
  sizeVolumeMl: number | null;
  unitPrice: number;
  iceLevel: number;
  sugarLevel: number;
  temperature: Temperature;
  note: string | null;
  quantity: number;
  lineTotal: number;
  toppings: { toppingId: number; toppingName: string; price: number; quantity: number }[];
}

export interface PaymentRow {
  id: number;
  method: PaymentMethod;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  gatewayRef: string | null;
  cardLast4: string | null;
  transferRef: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface RefundRow {
  id: number;
  paymentId: number;
  amount: number;
  reason: 'CANCEL' | 'MISSING_ITEM';
  note: string | null;
  createdByUserId: number;
  createdAt: Date;
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  userId: number;
  user: { id: number; phone: string; fullName: string; email: string | null };
  promotionId: number | null;
  promotionCode: string | null;
  promotion: { discountType: 'PERCENT' | 'FIXED' | 'FREE_DRINK'; discountValue: number; maxDiscountAmount: number | null } | null;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  pointsAwarded: number;
  pickupCode: string | null;
  cancelReason: CancelReason | null;
  cancelledByUserId: number | null;
  cancelNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDetail[];
  payments: PaymentRow[];
  refunds: RefundRow[];
  feedback: { rating: number; comment: string | null; createdAt: Date } | null;
}

// ───── Kiểm tra và tính giá từng dòng (BR02-BR05, BR35-BR37) ─────
export interface OrderLineInput {
  productId: number;
  sizeCode: SizeCode;
  iceLevel: number;
  sugarLevel: number;
  temperature: Temperature;
  note?: string | null;
  quantity: number;
  toppings?: { toppingId: number; quantity: number }[];
}

export interface PricedLine {
  product: Product;
  size: ProductSize;
  temperature: Temperature;
  iceLevel: number;
  sugarLevel: number;
  note: string | null;
  quantity: number;
  toppings: { topping: ProductTopping; quantity: number }[];
  unitPrice: number;
  lineTotal: number;
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function priceLine(input: OrderLineInput, product: Product | undefined): PricedLine {
  // BR01, BR02: món khóa bán hoặc không có thì 404, món hết bán thì 422
  if (!product || !isOnMenu(product)) throw new NotFoundError('Sản phẩm không tồn tại');
  const name = `"${product.name}"`;
  if (product.status === 'SOLD_OUT') throw new UnprocessableError(`Món ${name} đã hết bán`);

  const size = product.sizes.find((s) => s.sizeCode === input.sizeCode);
  if (!size) throw new UnprocessableError(`Món ${name} không có size ${input.sizeCode}`);

  // BR35: nhiệt độ phải được món cho phép, chọn nóng thì không đá
  if ((input.temperature === 'HOT' && !product.allowHot) || (input.temperature === 'COLD' && !product.allowCold)) {
    throw new UnprocessableError(`Món ${name} không phục vụ ${input.temperature === 'HOT' ? 'nóng' : 'lạnh'}`);
  }
  if (input.temperature === 'HOT' && input.iceLevel !== 0) throw new UnprocessableError(`Món ${name} chọn nóng thì mức đá phải bằng 0`);

  // BR04
  if (input.iceLevel < product.iceMin || input.iceLevel > product.iceMax) {
    throw new UnprocessableError(`Mức đá của món ${name} phải từ ${product.iceMin} đến ${product.iceMax}`);
  }
  if (input.sugarLevel < product.sugarMin || input.sugarLevel > product.sugarMax) {
    throw new UnprocessableError(`Mức đường của món ${name} phải từ ${product.sugarMin} đến ${product.sugarMax}`);
  }

  // BR36
  const note = input.note?.trim() || null;
  if (note && (wordCount(note) > 20 || note.length > 200)) throw new UnprocessableError('Ghi chú tối đa 20 từ và 200 ký tự');

  // BR05, BR37
  const toppings: PricedLine['toppings'] = [];
  const seen = new Set<number>();
  let totalPieces = 0;
  for (const t of input.toppings ?? []) {
    const topping = product.toppings.find((x) => x.id === t.toppingId);
    if (!topping || !topping.isAvailable) throw new UnprocessableError(`Topping ${t.toppingId} không có hoặc đang khóa bán với món ${name}`);
    if (seen.has(t.toppingId)) throw new UnprocessableError(`Topping "${topping.name}" bị chọn trùng trong một dòng`);
    seen.add(t.toppingId);
    if (t.quantity > product.maxPerTopping) throw new UnprocessableError(`Món ${name} tối đa ${product.maxPerTopping} phần mỗi loại topping`);
    totalPieces += t.quantity;
    toppings.push({ topping, quantity: t.quantity });
  }
  if (totalPieces > product.maxToppingTotal) throw new UnprocessableError(`Món ${name} tối đa ${product.maxToppingTotal} phần topping`);

  // BR03
  const unitPrice = size.price + toppings.reduce((s, t) => s + t.topping.price * t.quantity, 0);
  return { product, size, temperature: input.temperature, iceLevel: input.iceLevel, sugarLevel: input.sugarLevel, note, quantity: input.quantity, toppings, unitPrice, lineTotal: unitPrice * input.quantity };
}

// ───── Mã đơn, mã nhận hàng ─────
const pad = (n: number, w: number) => String(n).padStart(w, '0');

// BR25: BL + yyMMdd (giờ VN) + 4 chữ số ngẫu nhiên
export function generateOrderCode(now = new Date()): string {
  const vn = new Date(now.getTime() + 7 * 3600000);
  return `BL${pad(vn.getUTCFullYear() % 100, 2)}${pad(vn.getUTCMonth() + 1, 2)}${pad(vn.getUTCDate(), 2)}${pad(randomInt(0, 10000), 4)}`;
}

// BR12: mã nhận hàng 6 chữ số
export const generatePickupCode = () => String(randomInt(100000, 1000000));

// UC26: khách chỉ thấy mã nhận hàng khi đơn đang READY
export const pickupCodeFor = (o: Pick<OrderDetail, 'status' | 'pickupCode'>) => (o.status === 'READY' ? o.pickupCode : null);
