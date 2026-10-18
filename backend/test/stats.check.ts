import * as assert from 'assert';
import { assertRangeSize, fillSeries, resolveRange } from '../src/modules/stats/domain/stats';

// Khoảng mặc định là 30 ngày gần nhất; from sau to thì lỗi
const now = new Date('2026-10-18T05:00:00Z');
const r = resolveRange({}, now);
assert.strictEqual(r.to.getTime(), now.getTime());
assert.strictEqual((r.to.getTime() - r.from.getTime()) / 86400000, 30);
assert.throws(() => resolveRange({ from: new Date('2026-10-02'), to: new Date('2026-10-01') }));
assert.throws(() => assertRangeSize({ from: new Date('2024-01-01'), to: new Date('2026-01-01') }, 'day'));
assert.doesNotThrow(() => assertRangeSize({ from: new Date('2024-01-01'), to: new Date('2026-01-01') }, 'month'));

// Kỳ không có đơn vẫn có mặt với giá trị 0; ngày tính theo giờ VN (23h UTC ngày 17 đã là ngày 18 ở VN)
const range = { from: new Date('2026-10-16T17:30:00Z'), to: new Date('2026-10-19T02:00:00Z') }; // 17/10 00:30 VN → 19/10 09:00 VN
const days = fillSeries([{ period: '2026-10-18', revenue: 500, orders: 2 }], range, 'day');
assert.deepStrictEqual(days.map((d) => d.period), ['2026-10-17', '2026-10-18', '2026-10-19']);
assert.deepStrictEqual(days.map((d) => d.revenue), [0, 500, 0]);
const months = fillSeries([], { from: new Date('2026-11-20T00:00:00Z'), to: new Date('2027-02-05T00:00:00Z') }, 'month');
assert.deepStrictEqual(months.map((m) => m.period), ['2026-11', '2026-12', '2027-01', '2027-02']);
console.log('stats.check OK');
