import { Injectable } from '@nestjs/common';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { FeedbackRepository, FeedbackRow } from '../domain/feedback.repository';

@Injectable()
export class PrismaFeedbackRepository implements FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { orderId: number; userId: number; rating: number; comment: string | null }) {
    await this.prisma.db.serviceFeedback.create({ data });
  }

  async list(filter: { rating?: number }, page: PageRequest): Promise<Page<FeedbackRow>> {
    const where = filter.rating !== undefined ? { rating: filter.rating } : {};
    const [rows, total] = await Promise.all([
      this.prisma.db.serviceFeedback.findMany({
        where,
        include: { order: { select: { orderCode: true } }, user: { select: { id: true, phone: true, fullName: true } } },
        orderBy: { id: 'desc' },
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
      }),
      this.prisma.db.serviceFeedback.count({ where }),
    ]);
    return toPage(
      rows.map((r) => ({ id: r.id, orderId: r.orderId, orderCode: r.order.orderCode, customer: r.user, rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
      total,
      page,
    );
  }
}
