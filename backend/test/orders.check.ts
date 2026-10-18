import * as assert from 'assert';
import { Product } from '../src/modules/catalog/domain/product';
import { buildBill } from '../src/modules/orders/domain/bill';
import { assertTransition, generateOrderCode, isCancellable, OrderDetail, OrderStatus, priceLine } from '../src/modules/orders/domain/order';

// T1: chuyển trạng thái sai phải bị chặn (BR09, BR12, BR13)
const ok: [OrderStatus, OrderStatus][] = [['PENDING', 'PAID'], ['PENDING', 'PAYMENT_FAILED'], ['PAYMENT_FAILED', 'PAID'], ['PAID', 'PREPARING'], ['PREPARING', 'READY'], ['READY', 'COMPLETED'], ['PAID', 'CANCELLED']];
ok.forEach(([a, b]) => assert.doesNotThrow(() => assertTransition(a, b), `${a}→${b}`));
const bad: [OrderStatus, OrderStatus][] = [['PENDING', 'READY'], ['COMPLETED', 'PAID'], ['CANCELLED', 'PAID'], ['PREPARING', 'CANCELLED'], ['READY', 'CANCELLED'], ['PAID', 'READY'], ['COMPLETED', 'CANCELLED']];
bad.forEach(([a, b]) => assert.throws(() => assertTransition(a, b), `${a}→${b}`));
assert.deepStrictEqual((['PENDING', 'PAYMENT_FAILED', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).filter(isCancellable), ['PENDING', 'PAYMENT_FAILED', 'PAID']);

// BR25: mã đơn BL + yyMMdd theo giờ VN + 4 số
assert.match(generateOrderCode(new Date('2026-10-18T05:00:00Z')), /^BL261018\d{4}$/);
assert.match(generateOrderCode(new Date('2026-10-18T17:30:00Z')), /^BL261019\d{4}$/); // qua 0h giờ VN là sang ngày mới

// BR03, BR35, BR37: tính giá và kiểm từng dòng
const product: Product = {
  id: 1, categoryId: 1, category: { id: 1, name: 'Cà phê', isVisible: true }, name: 'Cà phê sữa', description: null, imageUrl: null, status: 'ON_SALE',
  allowHot: true, allowCold: true, defaultTemperature: 'COLD', maxPerTopping: 2, maxToppingTotal: 3, dailyQuota: 10, stockRemaining: 10, stockDate: null, stockVersion: 0,
  iceMin: 0, iceMax: 100, iceDefault: 50, sugarMin: 0, sugarMax: 100, sugarDefault: 50,
  sizes: [{ sizeCode: 'M', price: 32000, volumeMl: 460 }],
  toppings: [{ id: 5, name: 'Kem phô mai', price: 10000, isAvailable: true }, { id: 6, name: 'Shot', price: 12000, isAvailable: true }, { id: 9, name: 'Khóa', price: 9000, isAvailable: false }],
};
const line = { productId: 1, sizeCode: 'M' as const, iceLevel: 50, sugarLevel: 50, temperature: 'COLD' as const, quantity: 2, toppings: [{ toppingId: 5, quantity: 2 }, { toppingId: 6, quantity: 1 }] };
const priced = priceLine(line, product);
assert.strictEqual(priced.unitPrice, 32000 + 2 * 10000 + 12000); // 64.000đ
assert.strictEqual(priced.lineTotal, 128000);
const fails = (over: object, p: Product = product) => assert.throws(() => priceLine({ ...line, ...over }, p));
assert.throws(() => priceLine(line, undefined)); // không có món → 404
fails({}, { ...product, status: 'LOCKED' }); // khóa bán → 404
fails({}, { ...product, status: 'SOLD_OUT' }); // hết bán → 422
fails({ sizeCode: 'L' });
fails({ temperature: 'HOT' }); // nóng mà đá khác 0
fails({ temperature: 'HOT' }, { ...product, allowHot: false });
fails({ iceLevel: 101 });
fails({ sugarLevel: -1 });
fails({ toppings: [{ toppingId: 9, quantity: 1 }] }); // topping đang khóa
fails({ toppings: [{ toppingId: 5, quantity: 3 }] }); // vượt số phần mỗi loại
fails({ toppings: [{ toppingId: 5, quantity: 2 }, { toppingId: 6, quantity: 2 }] }); // vượt tổng
fails({ toppings: [{ toppingId: 5, quantity: 1 }, { toppingId: 5, quantity: 1 }] }); // trùng topping
fails({ note: Array(21).fill('a').join(' ') }); // quá 20 từ
assert.doesNotThrow(() => priceLine({ ...line, temperature: 'HOT', iceLevel: 0 }, product));

// BR38: hóa đơn
const order = {
  orderCode: 'BL2610180001', status: 'COMPLETED', subtotal: 128000, discountAmount: 12800, totalAmount: 115200, pointsAwarded: 110, promotionCode: 'WELCOME10',
  promotion: { discountType: 'PERCENT', discountValue: 10, maxDiscountAmount: 30000 }, user: { fullName: 'Khách', phone: '0922000001' },
  items: [{ quantity: 2, productName: 'Cà phê sữa', sizeCode: 'M', sizeVolumeMl: 460, unitPrice: 64000, lineTotal: 128000, temperature: 'COLD', iceLevel: 50, sugarLevel: 50, note: null, toppings: [{ toppingName: 'Kem phô mai', quantity: 2 }, { toppingName: 'Shot', quantity: 1 }] }],
  payments: [{ id: 1, method: 'CARD', status: 'SUCCESS', gatewayRef: 'MOCK-1', transferRef: null, createdAt: new Date('2026-10-18T05:00:00Z') }],
  refunds: [{ amount: 32000 }],
} as unknown as OrderDetail;
const bill = buildBill(order)!;
assert.strictEqual(bill.phoneMasked, '092****001');
assert.strictEqual(bill.netAmount, 115200 - 32000);
assert.strictEqual(bill.lines[0].sizeLabel, 'M · 460 ml');
assert.strictEqual(bill.lines[0].toppingsText, 'Kem phô mai x2, Shot');
assert.strictEqual(bill.promotionLabel, 'Giảm 10%, tối đa 30.000đ');
assert.strictEqual(buildBill({ ...order, payments: [] }), null); // chưa trả tiền thì không có hóa đơn
console.log('orders.check OK');
