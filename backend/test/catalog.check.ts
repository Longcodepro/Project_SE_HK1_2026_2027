import * as assert from 'assert';
import { assertValidSpec, ProductSpec, remainingToday } from '../src/modules/catalog/domain/product';

// BR49: số ly còn lại chỉ có hiệu lực trong đúng ngày đã nhập (giờ VN, UTC+7)
const stockDate = new Date(Date.UTC(2026, 9, 18)); // ngày 18/10/2026
const p = { stockDate, stockRemaining: 5 };
assert.strictEqual(remainingToday(p, new Date('2026-10-18T05:00:00Z')), 5); // 12h trưa VN
assert.strictEqual(remainingToday(p, new Date('2026-10-18T16:59:00Z')), 5); // 23h59 VN vẫn là ngày 18
assert.strictEqual(remainingToday(p, new Date('2026-10-18T17:00:00Z')), 0); // 0h ngày 19 VN: hết hiệu lực
assert.strictEqual(remainingToday({ stockDate: null, stockRemaining: 9 }), 0);

// BR35, BR37, BR04: các quy tắc chéo giữa nhiều trường
const ok: ProductSpec = {
  categoryId: 1, name: 'x', description: null, imageUrl: null,
  sizes: [{ sizeCode: 'M', price: 1, volumeMl: null }], toppingIds: [1],
  maxPerTopping: 1, maxToppingTotal: 3, allowHot: false, allowCold: true, defaultTemperature: 'COLD',
  iceMin: 0, iceMax: 100, iceDefault: 50, sugarMin: 0, sugarMax: 100, sugarDefault: 50,
};
assert.doesNotThrow(() => assertValidSpec(ok));
const bad = (over: Partial<ProductSpec>) => assert.throws(() => assertValidSpec({ ...ok, ...over }));
bad({ allowCold: false });
bad({ defaultTemperature: 'HOT' });
bad({ iceMin: 60, iceDefault: 50 });
bad({ maxPerTopping: 4, maxToppingTotal: 3 });
bad({ toppingIds: [] });
bad({ sizes: [{ sizeCode: 'M', price: 1, volumeMl: null }, { sizeCode: 'M', price: 2, volumeMl: null }] });
console.log('catalog.check OK');
