import { BadRequestError } from '../../../shared/domain/domain.error';

export type GroupBy = 'day' | 'month';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface RevenuePoint {
  period: string; // 'YYYY-MM-DD' hoặc 'YYYY-MM' theo giờ Việt Nam
  revenue: number;
  orders: number;
}

const DAY = 86400000;
const VN = 7 * 3600000;
const MAX_DAYS = 366;

// BR / UC64: mặc định 30 ngày gần nhất
export function resolveRange(q: { from?: Date; to?: Date }, now = new Date()): DateRange {
  const to = q.to ?? now;
  const from = q.from ?? new Date(to.getTime() - 30 * DAY);
  if (from > to) throw new BadRequestError('Ngày bắt đầu không được sau ngày kết thúc');
  return { from, to };
}

export function assertRangeSize(range: DateRange, groupBy: GroupBy) {
  if (groupBy === 'day' && (range.to.getTime() - range.from.getTime()) / DAY > MAX_DAYS) {
    throw new BadRequestError(`Thống kê theo ngày tối đa ${MAX_DAYS} ngày, hãy chọn nhóm theo tháng hoặc thu hẹp khoảng`);
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
const vnParts = (d: Date) => {
  const v = new Date(d.getTime() + VN);
  return { y: v.getUTCFullYear(), m: v.getUTCMonth() + 1, d: v.getUTCDate() };
};

// Mọi kỳ trong khoảng đều có mặt, kỳ không có đơn thì 0, để biểu đồ không bị thủng
export function fillSeries(points: RevenuePoint[], range: DateRange, groupBy: GroupBy): RevenuePoint[] {
  const byPeriod = new Map(points.map((p) => [p.period, p]));
  const start = vnParts(range.from);
  const end = vnParts(range.to);
  const out: RevenuePoint[] = [];
  if (groupBy === 'day') {
    for (let t = Date.UTC(start.y, start.m - 1, start.d); t <= Date.UTC(end.y, end.m - 1, end.d); t += DAY) {
      const d = new Date(t);
      const period = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      out.push(byPeriod.get(period) ?? { period, revenue: 0, orders: 0 });
    }
  } else {
    for (let y = start.y, m = start.m; y < end.y || (y === end.y && m <= end.m); m === 12 ? (y++, (m = 1)) : m++) {
      const period = `${y}-${pad(m)}`;
      out.push(byPeriod.get(period) ?? { period, revenue: 0, orders: 0 });
    }
  }
  return out;
}
