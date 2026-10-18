import { Injectable } from '@nestjs/common';
import { ORDER_STATUSES } from '../../orders/domain/order';
import { assertRangeSize, fillSeries, GroupBy, resolveRange } from '../domain/stats';
import { StatsRepository } from '../domain/stats.repository';

export interface StatsInput {
  from?: Date;
  to?: Date;
  groupBy?: GroupBy;
  limit?: number;
}

// UC64 Doanh thu theo ngày hoặc tháng, kèm tổng doanh thu, số đơn, giá trị đơn trung bình
@Injectable()
export class GetRevenueStatsUseCase {
  constructor(private readonly stats: StatsRepository) {}

  async execute(q: StatsInput) {
    const range = resolveRange(q);
    const groupBy = q.groupBy ?? 'day';
    assertRangeSize(range, groupBy);
    const series = fillSeries(await this.stats.revenueSeries(range, groupBy), range, groupBy);
    const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
    const orderCount = series.reduce((s, p) => s + p.orders, 0);
    return { ...range, groupBy, totalRevenue, orderCount, averageOrderValue: orderCount ? Math.round(totalRevenue / orderCount) : 0, series };
  }
}

// UC65 Món bán chạy theo tổng số ly
@Injectable()
export class GetTopProductsUseCase {
  constructor(private readonly stats: StatsRepository) {}

  async execute(q: StatsInput) {
    const range = resolveRange(q);
    return { ...range, items: await this.stats.topProducts(range, q.limit ?? 10) };
  }
}

// UC66 Topping được chọn nhiều theo tổng số phần (số phần × số ly)
@Injectable()
export class GetTopToppingsUseCase {
  constructor(private readonly stats: StatsRepository) {}

  async execute(q: StatsInput) {
    const range = resolveRange(q);
    return { ...range, items: await this.stats.topToppings(range, q.limit ?? 10) };
  }
}

// UC67 Số đơn theo trạng thái: luôn đủ 7 trạng thái, kể cả 0
@Injectable()
export class GetOrdersByStatusUseCase {
  constructor(private readonly stats: StatsRepository) {}

  async execute(q: StatsInput) {
    const range = resolveRange(q);
    const found = await this.stats.ordersByStatus(range);
    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, found[s] ?? 0]));
    return { ...range, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
  }
}
