import * as assert from 'assert';
import { pointsFor, remainingToNext, rewardsEarned } from '../src/modules/loyalty/domain/loyalty';
import { computeDiscount, discountSpecError, Promotion, statusOf, usabilityError } from '../src/modules/promotions/domain/promotion';

const base: Promotion = {
  id: 1, code: 'X', scope: 'PUBLIC', userId: null, ruleId: null, discountType: 'FIXED', discountValue: 20000, maxDiscountAmount: null,
  minOrderAmount: 50000, maxTotalUses: 2, maxUsesPerUser: 1, startsAt: new Date('2026-01-01'), endsAt: new Date('2026-12-31'), isActive: true, productIds: [],
};
const now = new Date('2026-06-01');
const ok = { now, userId: 7, subtotal: 60000, counts: { total: 0, byUser: 0 } };

// BR07: ba cách giảm
assert.strictEqual(computeDiscount(base, 60000), 20000);
assert.strictEqual(computeDiscount(base, 15000), 15000); // FIXED không giảm quá tổng đơn
const pct: Promotion = { ...base, discountType: 'PERCENT', discountValue: 10, maxDiscountAmount: 30000 };
assert.strictEqual(computeDiscount(pct, 100000), 10000);
assert.strictEqual(computeDiscount(pct, 1000000), 30000); // chặn bởi mức giảm tối đa
const free: Promotion = { ...base, discountType: 'FREE_DRINK', discountValue: 0, maxDiscountAmount: 50000, productIds: [1] };
assert.strictEqual(computeDiscount(free, 200000, 45000), 45000);
assert.strictEqual(computeDiscount(free, 200000, 80000), 50000);

// BR07, BR39: mã dùng được khi nào
assert.strictEqual(usabilityError(base, ok), null);
assert.ok(usabilityError({ ...base, isActive: false }, ok));
assert.ok(usabilityError(base, { ...ok, now: new Date('2027-01-01') })); // hết hạn
assert.ok(usabilityError(base, { ...ok, now: new Date('2025-01-01') })); // chưa tới hạn
assert.ok(usabilityError(base, { ...ok, subtotal: 49999 })); // chưa đủ đơn tối thiểu
assert.ok(usabilityError(base, { ...ok, counts: { total: 2, byUser: 0 } })); // hết tổng lượt
assert.ok(usabilityError(base, { ...ok, counts: { total: 0, byUser: 1 } })); // hết lượt của khách
assert.ok(usabilityError({ ...base, scope: 'PERSONAL', userId: 9 }, ok)); // mã riêng của người khác
assert.strictEqual(usabilityError({ ...base, scope: 'PERSONAL', userId: 7 }, ok), null);

// Trạng thái hiển thị cho quản lý
assert.strictEqual(statusOf(base, 2, now), 'exhausted');
assert.strictEqual(statusOf({ ...base, isActive: false }, 0, now), 'disabled');
assert.strictEqual(statusOf(base, 0, new Date('2027-01-01')), 'expired');

// BR07: quy tắc khai báo cách giảm
const spec = (o: object) => discountSpecError({ discountType: 'FIXED', discountValue: 1, maxDiscountAmount: null, productIds: [], ...o });
assert.strictEqual(spec({}), null);
assert.ok(spec({ discountType: 'PERCENT', discountValue: 10 })); // thiếu mức giảm tối đa
assert.ok(spec({ discountType: 'PERCENT', discountValue: 101, maxDiscountAmount: 1 }));
assert.ok(spec({ maxDiscountAmount: 5 })); // FIXED không được có mức tối đa
assert.ok(spec({ discountType: 'FREE_DRINK', discountValue: 0 })); // thiếu danh sách món
assert.strictEqual(spec({ discountType: 'FREE_DRINK', discountValue: 0, productIds: [1] }), null);

// BR11, BR40: điểm theo tiền và mốc thưởng
const s = { amountStep: 10000, pointsPerStep: 10 };
assert.strictEqual(pointsFor(95000, s), 90); // làm tròn xuống theo bước
assert.strictEqual(pointsFor(9999, s), 0);
assert.strictEqual(rewardsEarned(1499, 500), 2);
assert.strictEqual(remainingToNext(1499, 500), 1);
assert.strictEqual(remainingToNext(1500, 500), 500); // vừa chạm mốc thì mốc kế tiếp cách đủ một bước
console.log('promotions.check OK');
