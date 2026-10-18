import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Promotion, PromotionScope, UsageCounts } from '../domain/promotion';
import { NewPromotion, PromotionPatch, PromotionRepository, PromotionWithUsage } from '../domain/promotion.repository';

const include = { promotionProducts: true } satisfies Prisma.PromotionInclude;
type Row = Prisma.PromotionGetPayload<{ include: typeof include }>;

const toPromotion = ({ promotionProducts, createdAt: _c, ...p }: Row): Promotion => ({ ...p, productIds: promotionProducts.map((x) => x.productId).sort((a, b) => a - b) });

@Injectable()
export class PrismaPromotionRepository implements PromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string) {
    const row = await this.prisma.db.promotion.findUnique({ where: { code }, include });
    return row ? toPromotion(row) : null;
  }

  async findById(id: number) {
    const row = await this.prisma.db.promotion.findUnique({ where: { id }, include });
    return row ? toPromotion(row) : null;
  }

  async create(data: NewPromotion) {
    const { productIds, ...rest } = data;
    const row = await this.prisma.db.promotion.create({
      data: { ...rest, promotionProducts: { create: productIds.map((productId) => ({ productId })) } },
      include,
    });
    return toPromotion(row);
  }

  async update(id: number, patch: PromotionPatch) {
    return toPromotion(await this.prisma.db.promotion.update({ where: { id }, data: patch, include }));
  }

  private async usedByPromotion(): Promise<Map<number, number>> {
    const groups = await this.prisma.db.promotionUsage.groupBy({ by: ['promotionId'], where: { releasedAt: null }, _count: true });
    return new Map(groups.map((g) => [g.promotionId, g._count]));
  }

  async listWithUsage(scope?: PromotionScope): Promise<PromotionWithUsage[]> {
    const [rows, used] = await Promise.all([
      this.prisma.db.promotion.findMany({ where: scope ? { scope } : {}, include, orderBy: { id: 'desc' } }),
      this.usedByPromotion(),
    ]);
    return rows.map((r) => ({ promotion: toPromotion(r), usedCount: used.get(r.id) ?? 0 }));
  }

  async listForUser(userId: number, now: Date) {
    const rows = await this.prisma.db.promotion.findMany({
      where: { OR: [{ scope: 'PERSONAL', userId }, { scope: 'PUBLIC', isActive: true, endsAt: { gte: now } }] },
      include,
      orderBy: [{ scope: 'desc' }, { endsAt: 'asc' }],
    });
    const [used, mine] = await Promise.all([
      this.usedByPromotion(),
      this.prisma.db.promotionUsage.groupBy({ by: ['promotionId'], where: { userId, releasedAt: null }, _count: true }),
    ]);
    const byUser = new Map(mine.map((g) => [g.promotionId, g._count]));
    return rows.map((r) => ({ promotion: toPromotion(r), usedCount: used.get(r.id) ?? 0, usedByUser: byUser.get(r.id) ?? 0 }));
  }

  async lock(id: number) {
    await this.prisma.db.$queryRaw`SELECT "id" FROM "promotion" WHERE "id" = ${id} FOR UPDATE`;
  }

  async usageCounts(promotionId: number, userId: number): Promise<UsageCounts> {
    const [total, byUser] = await Promise.all([
      this.prisma.db.promotionUsage.count({ where: { promotionId, releasedAt: null } }),
      this.prisma.db.promotionUsage.count({ where: { promotionId, userId, releasedAt: null } }),
    ]);
    return { total, byUser };
  }

  async recordUsage(promotionId: number, userId: number, orderId: number) {
    await this.prisma.db.promotionUsage.create({ data: { promotionId, userId, orderId } });
  }

  async releaseUsage(orderId: number) {
    await this.prisma.db.promotionUsage.updateMany({ where: { orderId, releasedAt: null }, data: { releasedAt: new Date() } });
  }

  countByRuleAndUser(ruleId: number, userId: number) {
    return this.prisma.db.promotion.count({ where: { ruleId, userId } });
  }

  async codeExists(code: string) {
    return (await this.prisma.db.promotion.count({ where: { code } })) > 0;
  }
}
