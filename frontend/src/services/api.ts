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

// Lưu trữ đơn hàng demo offline vào localStorage khi chưa bật backend
const DEMO_ORDERS_KEY = "brewlite-demo-orders";

function getDemoOrders(): OrderResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoOrder(order: OrderResponse) {
  if (typeof window === "undefined") return;
  try {
    const orders = getDemoOrders();
    orders.unshift(order);
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

function updateDemoOrderStatus(orderId: string, status: "PAID" | "PAYMENT_FAILED") {
  if (typeof window === "undefined") return;
  try {
    const orders = getDemoOrders();
    const target = orders.find((o) => o.id === orderId);
    if (target) {
      target.status = status;
      localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
    }
  } catch {}
}

// 1. Đăng ký tài khoản (POST /auth/register)
export async function apiRegister(email: string, password: string) {
  try {
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
  } catch (err: any) {
    // Nếu là lỗi nghiệp vụ từ backend trả về (email đã dùng, validation...), giữ nguyên lỗi
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    // Nếu backend chưa bật (Failed to fetch) -> Tự động kích hoạt chế độ Demo Offline
    console.warn("[BrewLite] Backend (http://localhost:3001) chưa khởi động. Chuyển sang chế độ Demo Offline.");
    return {
      id: "demo-user-" + Date.now(),
      email,
      loyaltyPoints: 0,
      isDemo: true,
    };
  }
}

// 2. Đăng nhập lấy access_token (POST /auth/login)
export async function apiLogin(email: string, password: string) {
  try {
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
  } catch (err: any) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.warn("[BrewLite] Backend (http://localhost:3001) chưa khởi động. Đăng nhập chế độ Demo Offline.");
    return {
      access_token: "demo-jwt-token-" + Date.now(),
      user: {
        id: "demo-user-" + Date.now(),
        email: email || "sinhvien@brewlite.vn",
        loyaltyPoints: 15,
      },
    };
  }
}

// 3. Tạo đơn hàng (POST /orders)
export async function apiCreateOrder(token: string, items: OrderItemInput[]): Promise<OrderResponse> {
  try {
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
  } catch (err: any) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.warn("[BrewLite] Backend chưa bật, tạo đơn hàng ở chế độ Demo Offline");
    const demoTotal = items.reduce((sum, item) => sum + 40000 * item.qty, 0);
    const newDemoOrder: OrderResponse = {
      id: "ord-demo-" + Math.floor(1000 + Math.random() * 9000),
      userId: "demo-user",
      status: "PENDING",
      total: demoTotal,
      createdAt: new Date().toISOString(),
      items: items.map((i, idx) => ({
        id: `item-${idx}`,
        productId: i.productId,
        productName: i.productId,
        size: i.size,
        qty: i.qty,
        toppings: i.toppings,
        lineTotal: 40000 * i.qty,
      })),
    };
    saveDemoOrder(newDemoOrder);
    return newDemoOrder;
  }
}

// 4. Thanh toán đơn hàng (POST /payments)
export async function apiPayOrder(
  token: string,
  orderId: string,
  amount: number,
  method: "WALLET" | "CARD",
  idempotencyKey: string = generateUUID()
): Promise<PaymentResponse> {
  try {
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
  } catch (err: any) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.warn("[BrewLite] Backend chưa bật, giả lập thanh toán Demo (80% thành công, 20% thất bại)");
    const success = Math.random() < 0.8;
    const status = success ? "PAID" : "PAYMENT_FAILED";
    updateDemoOrderStatus(orderId, status);
    return {
      id: "pay-demo-" + Date.now(),
      orderId,
      amount,
      method,
      status,
    };
  }
}

// 5. Lấy danh sách lịch sử đơn hàng của user (GET /orders/me)
export async function apiGetMyOrders(token: string): Promise<OrderResponse[]> {
  try {
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
  } catch (err: any) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.warn("[BrewLite] Backend chưa bật, đọc danh sách đơn hàng từ Demo LocalStorage");
    return getDemoOrders();
  }
}
