import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { DateRange, GroupBy, RevenuePoint } from '../domain/stats';
import { StatsRepository, TopProduct, TopTopping } from '../domain/stats.repository';

// BR21: chỉ tính đơn đã trả tiền và còn hiệu lực
const COUNTED = Prisma.sql`o."status" IN ('PAID','PREPARING','READY','COMPLETED')`;

@Injectable()
export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async revenueSeries({ from, to }: DateRange, groupBy: GroupBy): Promise<RevenuePoint[]> {
    const format = groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    // createdAt lưu UTC; đổi sang giờ Việt Nam rồi mới gom theo ngày hoặc tháng
    const rows = await this.prisma.db.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT to_char(date_trunc(${groupBy}, o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'), ${format}) AS period,
             SUM(o."totalAmount")::int AS revenue, COUNT(*)::int AS orders
      FROM "order" o
      WHERE ${COUNTED} AND o."createdAt" >= ${from} AND o."createdAt" <= ${to}
      GROUP BY 1 ORDER BY 1`;
    return rows;
  }

  topProducts({ from, to }: DateRange, limit: number): Promise<TopProduct[]> {
    return this.prisma.db.$queryRaw<TopProduct[]>`
      SELECT i."productId" AS "productId", MAX(i."productName") AS name, SUM(i."quantity")::int AS "totalCups", SUM(i."lineTotal")::int AS revenue
      FROM "order_item" i JOIN "order" o ON o."id" = i."orderId"
      WHERE ${COUNTED} AND o."createdAt" >= ${from} AND o."createdAt" <= ${to}
      GROUP BY i."productId" ORDER BY "totalCups" DESC, i."productId" ASC LIMIT ${limit}`;
  }

  topToppings({ from, to }: DateRange, limit: number): Promise<TopTopping[]> {
    return this.prisma.db.$queryRaw<TopTopping[]>`
      SELECT t."toppingId" AS "toppingId", MAX(t."toppingName") AS name, SUM(t."quantity" * i."quantity")::int AS "totalPortions"
      FROM "order_item_topping" t JOIN "order_item" i ON i."id" = t."orderItemId" JOIN "order" o ON o."id" = i."orderId"
      WHERE ${COUNTED} AND o."createdAt" >= ${from} AND o."createdAt" <= ${to}
      GROUP BY t."toppingId" ORDER BY "totalPortions" DESC, t."toppingId" ASC LIMIT ${limit}`;
  }

  async ordersByStatus({ from, to }: DateRange): Promise<Record<string, number>> {
    const groups = await this.prisma.db.order.groupBy({ by: ['status'], where: { createdAt: { gte: from, lte: to } }, _count: true });
    return Object.fromEntries(groups.map((g) => [g.status, g._count]));
  }
}
