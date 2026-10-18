import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { CATEGORIES, PRODUCTS, TOPPINGS } from './seed-data/catalog';

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const [k, ...v] = t.split('=');
      if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}
process.env.DATABASE_URL ||= 'postgresql://brewlite:brewlite_dev@localhost:5432/brewlite';

const prisma = new PrismaClient();

// Mật khẩu chung của mọi tài khoản mẫu
export const SEED_PASSWORD = 'Brew@1234';
const DAY = 86400000;

// ───────────── Bộ sinh ngẫu nhiên cố định: chạy lại ra đúng cùng dữ liệu ─────────────
let state = 20261018;
function rnd(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const chance = (p: number) => rnd() < p;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) if ((r -= w) < 0) return v;
  return items[items.length - 1][0];
}

// Ngày theo giờ Việt Nam (UTC+7)
const VN = 7 * 3600000;
const vnMidnightUtc = (now: Date) => {
  const vn = new Date(now.getTime() + VN);
  return Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - VN;
};
const yymmdd = (d: Date) => {
  const vn = new Date(d.getTime() + VN);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(vn.getUTCFullYear() % 100)}${p(vn.getUTCMonth() + 1)}${p(vn.getUTCDate())}`;
};

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const DEM = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Quốc', 'Thanh', 'Hoàng', 'Gia', 'Anh', 'Khánh', 'Bảo', 'Tuấn'];
const TEN = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Hùng', 'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Ngân', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tài', 'Thảo', 'Trang', 'Trí', 'Uyên', 'Vy', 'Yến'];
const NOTES = ['ít đá giúp mình', 'không lấy ống hút', 'làm nhanh giúp mình nhé', 'ít ngọt', 'thêm nhiều sữa', 'để riêng đá', 'giao cho bạn mặc áo xanh'];
const COMMENTS = ['Đồ uống ngon, lên món nhanh', 'Nhân viên thân thiện', 'Hơi ngọt so với mình', 'Sẽ quay lại ủng hộ', 'Chờ hơi lâu nhưng đáng', 'Ly nhỏ hơn mình nghĩ', 'Rất hài lòng'];
const CANCEL_NOTES = ['Khách đổi ý không uống nữa', 'Nhầm món, đặt lại đơn khác', 'Hết nguyên liệu không làm được', 'Khách yêu cầu hủy qua điện thoại'];

type Rows<T> = T[];

async function main() {
  const reset = process.env.SEED_RESET === 'true';
  if (!reset && (await prisma.user.count()) > 0) {
    console.log('Database đã có dữ liệu, bỏ qua seed. Muốn nạp lại từ đầu: npm run seed:reset');
    return;
  }

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "notification","item_issue","withdrawal_request","wallet_transaction","refund","payment","service_feedback",
    "order_item_topping","order_item","promotion_usage","order","reward_rule_product","promotion_product","promotion",
    "reward_rule","loyalty_setting","product_topping","product_size","product","topping","category",
    "revoked_token","otp_code","user" RESTART IDENTITY CASCADE`);

  const now = new Date();
  const todayStart = vnMidnightUtc(now);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ───────────── Người dùng ─────────────
  type U = Prisma.UserCreateManyInput & { id: number };
  const users: U[] = [];
  const addUser = (u: Omit<U, 'id' | 'passwordHash'>) => {
    users.push({ ...u, id: users.length + 1, passwordHash });
    return users[users.length - 1];
  };
  const mk = (i: number) => `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;
  addUser({ phone: '0900000001', fullName: 'Nguyễn Quản Lý', role: 'MANAGER', isPhoneVerified: true, email: 'quanly@brewlite.vn' });
  addUser({ phone: '0900000002', fullName: 'Trần Thu Hà', role: 'MANAGER', isPhoneVerified: true, email: 'ha.manager@brewlite.vn' });
  for (let i = 1; i <= 5; i++) addUser({ phone: `091100000${i}`, fullName: `Nhân viên ${mk(i)}`, role: 'STAFF', isPhoneVerified: true, email: i <= 2 ? `nhanvien${i}@brewlite.vn` : null });
  const staffIds = users.filter((u) => u.role === 'STAFF').map((u) => u.id);
  const managerIds = users.filter((u) => u.role === 'MANAGER').map((u) => u.id);
  for (let i = 1; i <= 60; i++) {
    addUser({
      phone: `0922${String(i).padStart(6, '0')}`,
      fullName: mk(i),
      role: 'CUSTOMER',
      isPhoneVerified: true,
      isActive: i < 58, // 58, 59, 60 bị khóa để test
      email: i <= 12 ? `khach${i}@example.com` : null,
      createdAt: new Date(now.getTime() - int(30, 120) * DAY),
    });
  }
  addUser({ phone: '0933000001', fullName: 'Khách chưa xác thực OTP', role: 'CUSTOMER', isPhoneVerified: false });
  const customers = users.filter((u) => u.role === 'CUSTOMER' && u.isActive && u.isPhoneVerified);
  const stats = new Map<number, { points: number; cups: number; wallet: number }>();
  users.forEach((u) => stats.set(u.id, { points: 0, cups: 0, wallet: 0 }));

  // ───────────── Thực đơn ─────────────
  const todayDate = new Date(todayStart + VN); // 0h UTC của ngày VN, khớp cột @db.Date
  const yesterdayDate = new Date(todayDate.getTime() - DAY);
  const products: Prisma.ProductCreateManyInput[] = [];
  const sizes: Prisma.ProductSizeCreateManyInput[] = [];
  const productTopping: Prisma.ProductToppingCreateManyInput[] = [];
  type Meta = { id: number; name: string; sizes: { code: 'S' | 'M' | 'L'; price: number; ml: number | null }[]; toppings: number[]; allowHot: boolean; allowCold: boolean; defHot: boolean; noOptions: boolean; sellable: boolean; status: string; quota: number };
  const meta: Meta[] = [];
  const hiddenCategory = new Set(CATEGORIES.filter((c) => !c.isVisible).map((c) => c.id));
  PRODUCTS.forEach((p, idx) => {
    const id = idx + 1;
    const temp = p.temp ?? 'coldOnly';
    const allowHot = temp !== 'coldOnly' && !p.noOptions;
    const allowCold = temp !== 'hotOnly';
    const defHot = temp === 'hotOnly' || (temp === 'both' && !!p.defaultHot);
    const status = p.status ?? 'ON_SALE';
    const hasTop = p.toppings.length > 0;
    const quota = p.quota ?? 30;
    products.push({
      id,
      categoryId: p.categoryId,
      name: p.name,
      description: `${p.name} pha chế theo công thức của BrewLite.`,
      imageUrl: p.imageUrl,
      status,
      allowHot,
      allowCold: p.noOptions ? true : allowCold,
      defaultTemperature: defHot ? 'HOT' : 'COLD',
      maxPerTopping: hasTop ? 2 : 0,
      maxToppingTotal: hasTop ? 3 : 0,
      dailyQuota: quota,
      stockRemaining: quota, // trừ bớt theo đơn hôm nay ở bên dưới
      stockDate: p.staleStock ? yesterdayDate : todayDate,
      iceMin: 0,
      iceMax: p.noOptions || temp === 'hotOnly' ? 0 : 100,
      iceDefault: p.noOptions || temp === 'hotOnly' ? 0 : 75,
      sugarMin: 0,
      sugarMax: p.noOptions ? 0 : 100,
      sugarDefault: p.noOptions ? 0 : 50,
    });
    const sz: Meta['sizes'] = p.noOptions
      ? [{ code: 'M', price: p.priceM, ml: null }]
      : p.name === 'Espresso'
        ? [{ code: 'S', price: p.priceM, ml: 60 }]
        : [
            { code: 'S', price: p.priceM - 5000, ml: 360 },
            { code: 'M', price: p.priceM, ml: 460 },
            { code: 'L', price: p.priceM + 7000, ml: 560 },
          ];
    sz.forEach((s) => sizes.push({ productId: id, sizeCode: s.code, price: s.price, volumeMl: s.ml }));
    p.toppings.forEach((t) => productTopping.push({ productId: id, toppingId: t }));
    meta.push({ id, name: p.name, sizes: sz, toppings: p.toppings, allowHot, allowCold: p.noOptions ? true : allowCold, defHot, noOptions: !!p.noOptions, sellable: status !== 'LOCKED' && !hiddenCategory.has(p.categoryId) && !p.staleStock, status, quota });
  });
  const toppingMap = new Map(TOPPINGS.map((t) => [t.id, t]));

  // ───────────── Khuyến mãi (mã chung) ─────────────
  const promotions: Prisma.PromotionCreateManyInput[] = [];
  const addPromo = (p: Omit<Prisma.PromotionCreateManyInput, 'id'>) => {
    promotions.push({ ...p, id: promotions.length + 1 });
    return promotions.length;
  };
  const inDays = (d: number) => new Date(now.getTime() + d * DAY);
  const freeCupProducts = [1, 3, 11, 17, 21];
  const P_WELCOME = addPromo({ code: 'WELCOME10', scope: 'PUBLIC', discountType: 'PERCENT', discountValue: 10, maxDiscountAmount: 30000, minOrderAmount: 50000, maxTotalUses: null, maxUsesPerUser: 1, startsAt: inDays(-60), endsAt: inDays(120) });
  const P_GIAM20 = addPromo({ code: 'GIAM20K', scope: 'PUBLIC', discountType: 'FIXED', discountValue: 20000, maxDiscountAmount: null, minOrderAmount: 80000, maxTotalUses: 500, maxUsesPerUser: 2, startsAt: inDays(-60), endsAt: inDays(90) });
  const P_SUMMER = addPromo({ code: 'SUMMER15', scope: 'PUBLIC', discountType: 'PERCENT', discountValue: 15, maxDiscountAmount: 40000, minOrderAmount: 60000, maxTotalUses: 300, maxUsesPerUser: 2, startsAt: inDays(-40), endsAt: inDays(60) });
  const P_STUDENT = addPromo({ code: 'STUDENT5', scope: 'PUBLIC', discountType: 'FIXED', discountValue: 5000, maxDiscountAmount: null, minOrderAmount: 0, maxTotalUses: null, maxUsesPerUser: 3, startsAt: inDays(-90), endsAt: inDays(180) });
  const P_FREE = addPromo({ code: 'FREECUP', scope: 'PUBLIC', discountType: 'FREE_DRINK', discountValue: 0, maxDiscountAmount: 50000, minOrderAmount: 0, maxTotalUses: 100, maxUsesPerUser: 1, startsAt: inDays(-30), endsAt: inDays(60) });
  addPromo({ code: 'HETHAN01', scope: 'PUBLIC', discountType: 'FIXED', discountValue: 15000, maxDiscountAmount: null, minOrderAmount: 0, maxTotalUses: null, maxUsesPerUser: 1, startsAt: inDays(-90), endsAt: inDays(-10) });
  addPromo({ code: 'SAPDIENRA', scope: 'PUBLIC', discountType: 'PERCENT', discountValue: 20, maxDiscountAmount: 50000, minOrderAmount: 0, maxTotalUses: null, maxUsesPerUser: 1, startsAt: inDays(10), endsAt: inDays(40) });
  addPromo({ code: 'TAMDUNG01', scope: 'PUBLIC', discountType: 'FIXED', discountValue: 10000, maxDiscountAmount: null, minOrderAmount: 0, maxTotalUses: null, maxUsesPerUser: 1, startsAt: inDays(-30), endsAt: inDays(30), isActive: false });
  const P_LIMIT = addPromo({ code: 'CHILAN1', scope: 'PUBLIC', discountType: 'FIXED', discountValue: 10000, maxDiscountAmount: null, minOrderAmount: 0, maxTotalUses: 1, maxUsesPerUser: 1, startsAt: inDays(-30), endsAt: inDays(30) });
  addPromo({ code: 'DONLON100K', scope: 'PUBLIC', discountType: 'PERCENT', discountValue: 25, maxDiscountAmount: 100000, minOrderAmount: 300000, maxTotalUses: 50, maxUsesPerUser: 1, startsAt: inDays(-10), endsAt: inDays(50) });
  const promoPool = [
    { id: P_WELCOME, type: 'PERCENT', value: 10, max: 30000, min: 50000, perUser: 1 },
    { id: P_GIAM20, type: 'FIXED', value: 20000, max: null as number | null, min: 80000, perUser: 2 },
    { id: P_SUMMER, type: 'PERCENT', value: 15, max: 40000, min: 60000, perUser: 2 },
    { id: P_STUDENT, type: 'FIXED', value: 5000, max: null as number | null, min: 0, perUser: 3 },
  ];
  const codeOf = (id: number) => promotions[id - 1].code;
  const promoProducts: Prisma.PromotionProductCreateManyInput[] = freeCupProducts.map((productId) => ({ promotionId: P_FREE, productId }));

  const rules: Prisma.RewardRuleCreateManyInput[] = [
    { id: 1, name: 'Mỗi 10 ly tặng 1 ly miễn phí', kind: 'CUPS', threshold: 10, discountType: 'FREE_DRINK', discountValue: 0, maxDiscountAmount: 60000, minOrderAmount: 0, validDays: 30 },
    { id: 2, name: 'Mỗi 500 điểm tặng 20.000đ', kind: 'POINTS', threshold: 500, discountType: 'FIXED', discountValue: 20000, maxDiscountAmount: null, minOrderAmount: 0, validDays: 30 },
    { id: 3, name: 'Mỗi 1000 điểm giảm 15% (đã tắt)', kind: 'POINTS', threshold: 1000, discountType: 'PERCENT', discountValue: 15, maxDiscountAmount: 50000, minOrderAmount: 0, validDays: 14, isActive: false },
  ];
  const ruleProducts: Prisma.RewardRuleProductCreateManyInput[] = freeCupProducts.map((productId) => ({ ruleId: 1, productId }));

  // ───────────── Đơn hàng ─────────────
  type OD = {
    userId: number; createdAt: Date; status: string; paid: boolean; failedPay: boolean; cancelledByStaff: boolean;
    items: { productId: number; name: string; size: Meta['sizes'][number]; unit: number; ice: number; sugar: number; temp: 'HOT' | 'COLD'; note: string | null; qty: number; line: number; tops: { id: number; name: string; price: number; qty: number }[] }[];
    subtotal: number; promo?: { id: number; discount: number }; total: number;
  };
  const sellable = meta.filter((m) => m.sellable);
  const usedByUser = new Map<string, number>();
  const usedTotal = new Map<number, number>();
  const drafts: OD[] = [];
  const TOTAL_ORDERS = 340;
  const TODAY_STATUSES = ['PENDING', 'PENDING', 'PAYMENT_FAILED', 'PAID', 'PAID', 'PAID', 'PAID', 'PREPARING', 'PREPARING', 'PREPARING', 'READY', 'READY', 'READY', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'CANCELLED', 'CANCELLED', 'COMPLETED', 'PAID'];
  for (let n = 0; n < TOTAL_ORDERS; n++) {
    const dayOffset = n < 24 ? 0 : weighted<number>([[1, 5], [2, 5], [3, 4], [7, 12], [14, 12], [30, 14], [45, 8]]) + int(0, 3);
    let createdAt: Date;
    if (dayOffset === 0) {
      const elapsed = Math.max(30, Math.floor((now.getTime() - todayStart) / 60000));
      createdAt = new Date(now.getTime() - int(5, Math.min(elapsed, 600)) * 60000);
    } else {
      createdAt = new Date(todayStart - dayOffset * DAY + (int(7, 21) * 60 + int(0, 59)) * 60000);
    }
    const user = customers[Math.floor(Math.pow(rnd(), 1.6) * customers.length)]; // vài khách đặt nhiều hơn
    const items: OD['items'] = [];
    for (let k = int(1, 3); k > 0; k--) {
      const p = pick(sellable);
      const size = pick(p.sizes);
      const temp: 'HOT' | 'COLD' = p.allowHot && p.allowCold ? (chance(p.defHot ? 0.7 : 0.25) ? 'HOT' : 'COLD') : p.allowHot ? 'HOT' : 'COLD';
      const ice = p.noOptions || temp === 'HOT' || p.name === 'Espresso' ? 0 : pick([0, 25, 50, 75, 100]);
      const sugar = p.noOptions ? 0 : pick([0, 25, 50, 75, 100]);
      const tops: OD['items'][number]['tops'] = [];
      if (p.toppings.length && !p.noOptions && chance(0.5)) {
        const avail = p.toppings.filter((t) => toppingMap.get(t)!.isAvailable);
        let left = int(1, 3);
        for (const t of [...avail].sort(() => rnd() - 0.5)) {
          if (left <= 0) break;
          const q = Math.min(left, chance(0.2) ? 2 : 1);
          tops.push({ id: t, name: toppingMap.get(t)!.name, price: toppingMap.get(t)!.price, qty: q });
          left -= q;
        }
      }
      const qty = weighted([[1, 6], [2, 3], [3, 1]]);
      const unit = size.price + tops.reduce((s, t) => s + t.price * t.qty, 0);
      items.push({ productId: p.id, name: p.name, size, unit, ice, sugar, temp, note: chance(0.1) ? pick(NOTES) : null, qty, line: unit * qty, tops });
    }
    const subtotal = items.reduce((s, i) => s + i.line, 0);
    let promo: OD['promo'];
    const forceLimit = n === 5; // mã CHILAN1 đã hết lượt, để test lỗi "hết lượt dùng"
    if (forceLimit) {
      promo = { id: P_LIMIT, discount: Math.min(10000, subtotal) };
    } else if (chance(0.22)) {
      const c = pick(promoPool);
      const key = `${c.id}:${user.id}`;
      if (subtotal >= c.min && (usedByUser.get(key) ?? 0) < c.perUser) {
        const discount = c.type === 'FIXED' ? Math.min(c.value, subtotal) : Math.min(Math.floor((subtotal * c.value) / 100), c.max!);
        promo = { id: c.id, discount };
      }
    }
    // Phân bổ trạng thái theo độ cũ của đơn
    // 24 đơn hôm nay phủ đủ mọi trạng thái để nhân viên có đơn thật mà thao tác
    const status = dayOffset === 0
      ? TODAY_STATUSES[n % TODAY_STATUSES.length]
      : weighted([['COMPLETED', 86], ['CANCELLED', 14]]);
    const cancelledPaid = status === 'CANCELLED' && chance(0.55);
    const paid = ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(status) || cancelledPaid;
    drafts.push({
      userId: user.id, createdAt, status, paid, items, subtotal, promo,
      failedPay: status === 'PAYMENT_FAILED' || (status === 'CANCELLED' && !cancelledPaid && chance(0.3)),
      cancelledByStaff: chance(0.35),
      total: subtotal - (promo?.discount ?? 0),
    });
    if (promo && status !== 'CANCELLED') {
      const key = `${promo.id}:${user.id}`;
      usedByUser.set(key, (usedByUser.get(key) ?? 0) + 1);
    }
    if (promo) usedTotal.set(promo.id, (usedTotal.get(promo.id) ?? 0) + (status === 'CANCELLED' ? 0 : 1));
  }
  drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const orders: Prisma.OrderCreateManyInput[] = [];
  const orderItems: Prisma.OrderItemCreateManyInput[] = [];
  const orderTops: Prisma.OrderItemToppingCreateManyInput[] = [];
  const payments: Prisma.PaymentCreateManyInput[] = [];
  const refunds: Prisma.RefundCreateManyInput[] = [];
  const walletTx: Prisma.WalletTransactionCreateManyInput[] = [];
  const usages: Prisma.PromotionUsageCreateManyInput[] = [];
  const feedbacks: Prisma.ServiceFeedbackCreateManyInput[] = [];
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  const reservedToday = new Map<number, number>();
  const codes = new Set<string>();
  const pickups = new Set<string>();
  const orderMeta: { id: number; userId: number; status: string; paymentId: number | null; items: { id: number; unit: number; qty: number }[]; total: number; createdAt: Date }[] = [];
  const userById = new Map(users.map((u) => [u.id, u]));
  const addNote = (userId: number, orderId: number | null, event: Prisma.NotificationCreateManyInput['event'], content: string, at: Date) => {
    const u = userById.get(userId)!;
    const status = chance(0.02) ? 'FAILED' : 'SENT';
    notifications.push({ userId, orderId, event, channel: 'SMS', recipient: u.phone, content, status, createdAt: at });
    if (u.email && event !== 'REWARD_ISSUED') notifications.push({ userId, orderId, event, channel: 'EMAIL', recipient: u.email, content, status: 'SENT', createdAt: at });
  };
  let itemId = 0, topId = 0, payId = 0, refundId = 0, txId = 0;
  drafts.forEach((d, i) => {
    const id = i + 1;
    let code = '';
    do code = `BL${yymmdd(d.createdAt)}${String(int(0, 9999)).padStart(4, '0')}`; while (codes.has(code));
    codes.add(code);
    const st = stats.get(d.userId)!;
    const needPickup = d.status === 'READY' || d.status === 'COMPLETED';
    let pickupCode: string | null = null;
    if (needPickup) {
      do pickupCode = String(int(100000, 999999)); while (pickups.has(pickupCode));
      pickups.add(pickupCode);
    }
    const cancelled = d.status === 'CANCELLED';
    const staffId = pick(staffIds);
    const points = d.paid && !cancelled ? Math.floor(d.total / 10000) * 10 : 0;
    const cups = d.items.reduce((s, x) => s + x.qty, 0);
    const updatedAt = new Date(d.createdAt.getTime() + (d.status === 'PENDING' ? 0 : int(5, 40) * 60000));
    orders.push({
      id, orderCode: code, userId: d.userId, status: d.status as any,
      promotionId: d.promo?.id ?? null, promotionCode: d.promo ? codeOf(d.promo.id) : null,
      subtotal: d.subtotal, discountAmount: d.promo?.discount ?? 0, totalAmount: d.total, pointsAwarded: points, pickupCode,
      cancelReason: cancelled ? (d.cancelledByStaff ? 'STAFF_CANCEL' : 'CUSTOMER_CANCEL') : null,
      cancelledByUserId: cancelled ? (d.cancelledByStaff ? staffId : d.userId) : null,
      cancelNote: cancelled ? (d.cancelledByStaff ? pick(CANCEL_NOTES) : chance(0.5) ? 'Mình đổi ý' : null) : null,
      createdAt: d.createdAt, updatedAt,
    });
    const itemRefs: { id: number; unit: number; qty: number }[] = [];
    d.items.forEach((it) => {
      const oi = ++itemId;
      itemRefs.push({ id: oi, unit: it.unit, qty: it.qty });
      orderItems.push({ id: oi, orderId: id, productId: it.productId, productName: it.name, sizeCode: it.size.code, sizeVolumeMl: it.size.ml, unitPrice: it.unit, iceLevel: it.ice, sugarLevel: it.sugar, temperature: it.temp, note: it.note, quantity: it.qty, lineTotal: it.line });
      it.tops.forEach((t) => orderTops.push({ id: ++topId, orderItemId: oi, toppingId: t.id, toppingName: t.name, price: t.price, quantity: t.qty }));
      if (d.createdAt.getTime() >= todayStart && !cancelled) reservedToday.set(it.productId, (reservedToday.get(it.productId) ?? 0) + it.qty);
    });
    if (d.promo) usages.push({ promotionId: d.promo.id, userId: d.userId, orderId: id, createdAt: d.createdAt, releasedAt: cancelled ? updatedAt : null });
    let paymentId: number | null = null;
    const method = pick(['EWALLET', 'CARD', 'TRANSFER'] as const);
    if (d.paid || d.failedPay) {
      paymentId = ++payId;
      const ok = d.paid;
      payments.push({
        id: paymentId, orderId: id, method, amount: d.total, status: ok ? 'SUCCESS' : 'FAILED',
        idempotencyKey: `seed-order-${id}-1`, gatewayRef: ok ? `MOCK-${method}-${100000 + id}` : null,
        cardLast4: method === 'CARD' ? (ok ? '1111' : '0002') : null,
        transferRef: method === 'TRANSFER' ? `BL${yymmdd(d.createdAt)}${String(1000 + id).padStart(4, '0')}` : null,
        expiresAt: method === 'TRANSFER' ? new Date(d.createdAt.getTime() + 10 * 60000) : null,
        createdAt: new Date(d.createdAt.getTime() + 2 * 60000),
      });
    }
    if (d.paid && !cancelled) {
      st.points += points;
      st.cups += cups;
    }
    if (d.paid && cancelled) {
      const by = d.cancelledByStaff ? orders[i].cancelledByUserId! : d.userId;
      refunds.push({ id: ++refundId, orderId: id, paymentId: paymentId!, amount: d.total, reason: 'CANCEL', createdByUserId: by, note: orders[i].cancelNote, createdAt: updatedAt });
      walletTx.push({ id: ++txId, userId: d.userId, type: 'REFUND_IN', amount: d.total, refundId, createdAt: updatedAt });
      st.wallet += d.total;
    }
    orderMeta.push({ id, userId: d.userId, status: d.status, paymentId, items: itemRefs, total: d.total, createdAt: d.createdAt });
    // Thông báo theo mốc đơn (BR28)
    addNote(d.userId, id, 'ORDER_CREATED', `BrewLite: đơn ${code} đã được tạo, tổng ${d.total.toLocaleString('vi-VN')}đ.`, d.createdAt);
    if (d.paid) addNote(d.userId, id, 'PAYMENT_SUCCESS', `BrewLite: đã thanh toán đơn ${code} thành công. Cảm ơn bạn!`, new Date(d.createdAt.getTime() + 3 * 60000));
    if (d.status === 'READY' || d.status === 'COMPLETED') addNote(d.userId, id, 'ORDER_READY', `BrewLite: đơn ${code} đã xong, mã nhận hàng ${pickupCode}.`, updatedAt);
    if (d.status === 'COMPLETED') {
      addNote(d.userId, id, 'ORDER_COMPLETED', `BrewLite: cảm ơn bạn đã nhận đơn ${code}. Hẹn gặp lại!`, updatedAt);
      if (chance(0.45)) feedbacks.push({ orderId: id, userId: d.userId, rating: weighted([[5, 8], [4, 5], [3, 2], [2, 1], [1, 1]]), comment: chance(0.7) ? pick(COMMENTS) : null, createdAt: new Date(updatedAt.getTime() + int(10, 600) * 60000) });
    }
  });

  // ───────────── Xử lý món không làm được (UC74): hoàn tiền món vào ví hoặc đổi món ─────────────
  const itemIssues: Prisma.ItemIssueCreateManyInput[] = [];
  const candidates = orderMeta.filter((o) => ['COMPLETED', 'READY', 'PREPARING', 'PAID'].includes(o.status) && o.paymentId);
  for (let k = 0; k < 14 && candidates.length; k++) {
    const o = candidates.splice(int(0, candidates.length - 1), 1)[0];
    const it = pick(o.items);
    const refundToWallet = chance(0.6);
    const staffId = pick(staffIds);
    let rid: number | null = null;
    if (refundToWallet) {
      const amount = Math.min(it.unit, o.total);
      rid = ++refundId;
      const at = new Date(o.createdAt.getTime() + 20 * 60000);
      refunds.push({ id: rid, orderId: o.id, paymentId: o.paymentId!, amount, reason: 'MISSING_ITEM', createdByUserId: staffId, note: 'Hết nguyên liệu', createdAt: at });
      walletTx.push({ id: ++txId, userId: o.userId, type: 'REFUND_IN', amount, refundId: rid, createdAt: at });
      stats.get(o.userId)!.wallet += amount;
    }
    itemIssues.push({ orderId: o.id, orderItemId: it.id, quantity: 1, resolution: refundToWallet ? 'REFUND_TO_WALLET' : 'EXCHANGE', refundId: rid, note: refundToWallet ? 'Hết nguyên liệu, hoàn tiền vào ví' : 'Khách đổi sang món khác ngoài quầy', handledByUserId: staffId, createdAt: new Date(o.createdAt.getTime() + 20 * 60000) });
  }

  // ───────────── Rút tiền từ ví (UC72, UC73) ─────────────
  const withdrawals: Prisma.WithdrawalRequestCreateManyInput[] = [];
  const richest = [...customers].sort((a, b) => stats.get(b.id)!.wallet - stats.get(a.id)!.wallet).filter((u) => stats.get(u.id)!.wallet >= 10000).slice(0, 9);
  const plan: ('PENDING' | 'COMPLETED' | 'REJECTED')[] = ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'REJECTED', 'REJECTED'];
  richest.forEach((u, i) => {
    const w = stats.get(u.id)!;
    const status = plan[i];
    const amount = Math.max(10000, Math.min(w.wallet, Math.floor(w.wallet / 2 / 5000) * 5000));
    if (amount > w.wallet) return;
    const wid = i + 1;
    const dest = pick(['EWALLET', 'CARD', 'BANK'] as const);
    const at = new Date(now.getTime() - int(1, 10) * DAY);
    withdrawals.push({
      id: wid, userId: u.id, amount, destinationType: dest, accountName: u.fullName.toUpperCase(), accountNumber: String(int(100000000, 999999999)),
      bankName: dest === 'EWALLET' ? null : pick(['Vietcombank', 'MB Bank', 'Techcombank', 'ACB']), status,
      rejectReason: status === 'REJECTED' ? 'Sai thông tin tài khoản nhận' : null,
      transferRef: status === 'COMPLETED' ? `CK${int(100000, 999999)}` : null,
      handledByUserId: status === 'PENDING' ? null : pick(managerIds), handledAt: status === 'PENDING' ? null : new Date(at.getTime() + 3600000), createdAt: at,
    });
    walletTx.push({ id: ++txId, userId: u.id, type: 'WITHDRAW_OUT', amount, withdrawalId: wid, createdAt: at });
    w.wallet -= amount;
    if (status === 'REJECTED') {
      walletTx.push({ id: ++txId, userId: u.id, type: 'WITHDRAW_RETURN', amount, withdrawalId: wid, createdAt: new Date(at.getTime() + 3600000) });
      w.wallet += amount;
    }
    if (status !== 'PENDING') addNote(u.id, null, status === 'COMPLETED' ? 'WITHDRAWAL_COMPLETED' : 'WITHDRAWAL_REJECTED', status === 'COMPLETED' ? `BrewLite: đã chuyển ${amount.toLocaleString('vi-VN')}đ về tài khoản của bạn.` : 'BrewLite: yêu cầu rút tiền bị từ chối, tiền đã hoàn lại ví.', new Date(at.getTime() + 3600000));
  });

  // ───────────── Mã thưởng riêng tự cấp theo mốc (BR40) ─────────────
  for (const u of customers) {
    const st = stats.get(u.id)!;
    const grant = (ruleId: number, count: number, tag: string) => {
      for (let k = 1; k <= Math.min(count, 3); k++) {
        const grantedAt = new Date(now.getTime() - int(0, 40) * DAY);
        const free = ruleId === 1;
        const pid = addPromo({
          code: `RW${tag}${String(u.id).padStart(3, '0')}${k}`, scope: 'PERSONAL', userId: u.id, ruleId,
          discountType: free ? 'FREE_DRINK' : 'FIXED', discountValue: free ? 0 : 20000, maxDiscountAmount: free ? 60000 : null, minOrderAmount: 0,
          maxTotalUses: 1, maxUsesPerUser: 1, startsAt: grantedAt, endsAt: new Date(grantedAt.getTime() + 30 * DAY),
        });
        if (free) freeCupProducts.forEach((productId) => promoProducts.push({ promotionId: pid, productId }));
        addNote(u.id, null, 'REWARD_ISSUED', free ? 'BrewLite: bạn nhận được mã tặng 1 ly miễn phí.' : 'BrewLite: bạn nhận được mã giảm 20.000đ.', grantedAt);
      }
    };
    grant(1, Math.floor(st.cups / 10), 'C');
    grant(2, Math.floor(st.points / 500), 'P');
  }

  // Trừ số ly còn lại hôm nay theo các đơn chưa hủy
  products.forEach((p) => {
    if (p.stockDate === todayDate) p.stockRemaining = Math.max(0, p.dailyQuota! - (reservedToday.get(p.id as number) ?? 0));
    else p.stockRemaining = 0;
  });
  products.forEach((p) => { if (p.name === 'Nước ép cà rốt') { p.dailyQuota = 40; p.stockRemaining = 0; } });

  // ───────────── Ghi vào DB ─────────────
  const put = async <T>(label: string, rows: Rows<T>, fn: (r: Rows<T>) => Promise<unknown>) => {
    for (let i = 0; i < rows.length; i += 1000) await fn(rows.slice(i, i + 1000));
    console.log(`  ${label}: ${rows.length}`);
  };
  console.log('Đang nạp dữ liệu mẫu...');
  users.forEach((u) => { const s = stats.get(u.id)!; u.loyaltyPoints = s.points; u.totalCups = s.cups; u.walletBalance = s.wallet; });
  await put('user', users, (r) => prisma.user.createMany({ data: r }));
  await put('category', CATEGORIES, (r) => prisma.category.createMany({ data: r }));
  await put('topping', TOPPINGS, (r) => prisma.topping.createMany({ data: r }));
  await put('product', products, (r) => prisma.product.createMany({ data: r }));
  await put('product_size', sizes, (r) => prisma.productSize.createMany({ data: r }));
  await put('product_topping', productTopping, (r) => prisma.productTopping.createMany({ data: r }));
  await prisma.loyaltySetting.create({ data: { id: 1, amountStep: 10000, pointsPerStep: 10 } });
  await put('reward_rule', rules, (r) => prisma.rewardRule.createMany({ data: r }));
  await put('reward_rule_product', ruleProducts, (r) => prisma.rewardRuleProduct.createMany({ data: r }));
  await put('promotion', promotions, (r) => prisma.promotion.createMany({ data: r }));
  await put('promotion_product', promoProducts, (r) => prisma.promotionProduct.createMany({ data: r }));
  await put('order', orders, (r) => prisma.order.createMany({ data: r }));
  await put('order_item', orderItems, (r) => prisma.orderItem.createMany({ data: r }));
  await put('order_item_topping', orderTops, (r) => prisma.orderItemTopping.createMany({ data: r }));
  await put('promotion_usage', usages, (r) => prisma.promotionUsage.createMany({ data: r }));
  await put('payment', payments, (r) => prisma.payment.createMany({ data: r }));
  await put('refund', refunds, (r) => prisma.refund.createMany({ data: r }));
  await put('withdrawal_request', withdrawals, (r) => prisma.withdrawalRequest.createMany({ data: r }));
  await put('wallet_transaction', walletTx, (r) => prisma.walletTransaction.createMany({ data: r }));
  await put('item_issue', itemIssues, (r) => prisma.itemIssue.createMany({ data: r }));
  await put('service_feedback', feedbacks, (r) => prisma.serviceFeedback.createMany({ data: r }));
  await put('notification', notifications, (r) => prisma.notification.createMany({ data: r }));

  // id được gán tay nên phải đẩy sequence lên để bản ghi tạo sau không trùng id
  for (const t of ['user', 'category', 'product', 'product_size', 'topping', 'promotion', 'promotion_usage', 'reward_rule', 'order', 'order_item', 'order_item_topping', 'service_feedback', 'payment', 'refund', 'wallet_transaction', 'withdrawal_request', 'item_issue', 'notification']) {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${t}"','id'), COALESCE(MAX(id),1), MAX(id) IS NOT NULL) FROM "${t}"`);
  }

  console.log(`\nXong. Mật khẩu mọi tài khoản mẫu: ${SEED_PASSWORD}`);
  console.log('  Quản lý : 0900000001, 0900000002');
  console.log('  Nhân viên: 0911000001 ... 0911000005');
  console.log('  Khách   : 0922000001 ... 0922000057 (còn dùng), 0922000058-60 (bị khóa), 0933000001 (chưa xác thực OTP)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
