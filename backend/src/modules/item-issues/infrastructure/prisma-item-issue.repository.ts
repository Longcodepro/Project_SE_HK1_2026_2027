import { Injectable } from '@nestjs/common';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ItemIssueRow, ItemResolution, NewItemIssue } from '../domain/item-issue';
import { ItemIssueRepository } from '../domain/item-issue.repository';

@Injectable()
export class PrismaItemIssueRepository implements ItemIssueRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewItemIssue) {
    return this.prisma.db.itemIssue.create({ data, select: { id: true } });
  }

  async handledQuantity(orderItemId: number) {
    const agg = await this.prisma.db.itemIssue.aggregate({ where: { orderItemId }, _sum: { quantity: true } });
    return agg._sum.quantity ?? 0;
  }

  async list(filter: { from?: Date; to?: Date; resolution?: ItemResolution }, page: PageRequest): Promise<Page<ItemIssueRow>> {
    const where = {
      ...(filter.resolution && { resolution: filter.resolution }),
      ...((filter.from || filter.to) && { createdAt: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.db.itemIssue.findMany({
        where,
        include: { order: { select: { orderCode: true } }, orderItem: { select: { productName: true } }, refund: { select: { amount: true } }, handledByUser: { select: { id: true, fullName: true } } },
        orderBy: { id: 'desc' },
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
      }),
      this.prisma.db.itemIssue.count({ where }),
    ]);
    const items = rows.map((r) => ({
      id: r.id, orderId: r.orderId, orderCode: r.order.orderCode, orderItemId: r.orderItemId, productName: r.orderItem.productName,
      quantity: r.quantity, resolution: r.resolution, refundAmount: r.refund?.amount ?? null, note: r.note, handledBy: r.handledByUser, createdAt: r.createdAt,
    }));
    return toPage(items, total, page);
  }
}
