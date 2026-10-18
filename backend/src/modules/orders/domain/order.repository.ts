import { Page, PageRequest } from '../../../shared/domain/page';
import { CancelReason, OrderDetail, OrderStatus } from './order';

export interface NewOrder {
  orderCode: string;
  userId: number;
  promotionId: number | null;
  promotionCode: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items: {
    productId: number;
    productName: string;
    sizeCode: string;
    sizeVolumeMl: number | null;
    unitPrice: number;
    iceLevel: number;
    sugarLevel: number;
    temperature: string;
    note: string | null;
    quantity: number;
    lineTotal: number;
    toppings: { toppingId: number; toppingName: string; price: number; quantity: number }[];
  }[];
}

export interface OrderSummary {
  id: number;
  orderCode: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  customer?: { id: number; phone: string; fullName: string };
}

export interface OrderPatch {
  status?: OrderStatus;
  pickupCode?: string | null;
  cancelReason?: CancelReason;
  cancelledByUserId?: number;
  cancelNote?: string | null;
  pointsAwarded?: number;
}

export abstract class OrderRepository {
  abstract create(data: NewOrder): Promise<OrderDetail>;
  abstract findById(id: number): Promise<OrderDetail | null>;
  // Khóa dòng đơn rồi đọc, để hủy / chuyển trạng thái / thanh toán đồng thời không đè nhau
  abstract lockById(id: number): Promise<OrderDetail | null>;
  abstract findByPickupCode(code: string): Promise<OrderDetail | null>;
  abstract listByUser(userId: number): Promise<OrderSummary[]>;
  abstract listAll(filter: { status?: OrderStatus }, page: PageRequest): Promise<Page<OrderSummary>>;
  abstract update(id: number, patch: OrderPatch): Promise<void>;
  abstract orderCodeExists(code: string): Promise<boolean>;
  abstract pickupCodeExists(code: string): Promise<boolean>;
}
