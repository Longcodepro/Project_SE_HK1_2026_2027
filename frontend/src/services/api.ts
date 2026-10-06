const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface OrderItemInput {
  productId: string;
  size: "S" | "M" | "L";
  qty: number;
  toppings?: string[];
}

export interface OrderResponseItem {
  id: string;
  productId: string;
  productName?: string;
  size: "S" | "M" | "L";
  qty: number;
  toppings?: string[];
  lineTotal: number;
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: "PENDING" | "PAID" | "PREPARING" | "READY" | "COMPLETED" | "PAYMENT_FAILED" | "CANCELLED";
  total: number;
  createdAt: string;
  items: OrderResponseItem[];
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: "WALLET" | "CARD";
  status: "PAID" | "PAYMENT_FAILED";
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 1. Đăng ký tài khoản
export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(errorMsg || "Đăng ký thất bại");
  }
  return data;
}

// 2. Đăng nhập lấy access_token
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(errorMsg || "Đăng nhập thất bại");
  }
  return data as {
    access_token: string;
    user: { id: string; email: string; loyaltyPoints: number };
  };
}

// 3. Tạo đơn hàng (POST /orders)
export async function apiCreateOrder(token: string, items: OrderItemInput[]): Promise<OrderResponse> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(errorMsg || "Không thể tạo đơn hàng");
  }
  return data;
}

// 4. Thanh toán đơn hàng (POST /payments)
export async function apiPayOrder(
  token: string,
  orderId: string,
  amount: number,
  method: "WALLET" | "CARD",
  idempotencyKey: string = generateUUID()
): Promise<PaymentResponse> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      orderId,
      amount,
      method,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(errorMsg || "Thanh toán không thành công");
  }
  return data;
}

// 5. Lấy danh sách lịch sử đơn hàng của user (GET /orders/me)
export async function apiGetMyOrders(token: string): Promise<OrderResponse[]> {
  const res = await fetch(`${API_BASE}/orders/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(errorMsg || "Không thể lấy danh sách đơn hàng");
  }
  return data;
}
