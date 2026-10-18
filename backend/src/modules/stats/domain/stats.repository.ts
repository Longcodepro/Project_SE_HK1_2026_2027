import { DateRange, GroupBy, RevenuePoint } from './stats';

export interface TopProduct {
  productId: number;
  name: string;
  totalCups: number;
  revenue: number;
}

export interface TopTopping {
  toppingId: number;
  name: string;
  totalPortions: number;
}

export abstract class StatsRepository {
  // Chỉ tính đơn đã trả tiền và còn hiệu lực (BR21)
  abstract revenueSeries(range: DateRange, groupBy: GroupBy): Promise<RevenuePoint[]>;
  abstract topProducts(range: DateRange, limit: number): Promise<TopProduct[]>;
  abstract topToppings(range: DateRange, limit: number): Promise<TopTopping[]>;
  // Đếm theo trạng thái trên mọi đơn tạo trong khoảng, không lọc trạng thái
  abstract ordersByStatus(range: DateRange): Promise<Record<string, number>>;
}
