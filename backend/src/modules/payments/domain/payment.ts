import { PaymentMethod } from '../../orders/domain/order';

export interface CardInput {
  number: string; // 16 chữ số, không lưu, không ghi log (BR41)
  holderName?: string;
  expiry: string; // MM/YY
  cvv: string;
}

export interface Payment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  idempotencyKey: string;
  gatewayRef: string | null;
  cardLast4: string | null;
  transferRef: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface GatewayRequest {
  method: PaymentMethod;
  amount: number;
  orderCode: string;
  card?: CardInput;
}

export interface GatewayResult {
  success: boolean;
  gatewayRef: string | null;
  failureReason?: string;
  transferRef?: string;
  expiresAt?: Date;
}

// Thẻ hết hạn khi tháng ghi trên thẻ đã qua. Hạn "MM/YY" còn dùng được tới hết tháng đó (giờ VN).
export function isCardExpired(expiry: string, now = new Date()): boolean {
  const [mm, yy] = expiry.split('/').map(Number);
  const vn = new Date(now.getTime() + 7 * 3600000);
  const nowKey = (vn.getUTCFullYear() % 100) * 12 + vn.getUTCMonth();
  return yy * 12 + (mm - 1) < nowKey;
}
