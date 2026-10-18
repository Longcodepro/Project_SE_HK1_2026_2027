import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { LoyaltySettings, RewardRule } from '../domain/loyalty';
import { LoyaltyRepository, NewRule, RulePatch, UserCounters } from '../domain/loyalty.repository';

const include = { rewardRuleProducts: true } satisfies Prisma.RewardRuleInclude;
type Row = Prisma.RewardRuleGetPayload<{ include: typeof include }>;
const toRule = ({ rewardRuleProducts, ...r }: Row): RewardRule => ({ ...r, productIds: rewardRuleProducts.map((p) => p.productId).sort((a, b) => a - b) });

@Injectable()
export class PrismaLoyaltyRepository implements LoyaltyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<LoyaltySettings> {
    const row = await this.prisma.db.loyaltySetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    return { amountStep: row.amountStep, pointsPerStep: row.pointsPerStep };
  }

  async updateSettings(patch: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
    const row = await this.prisma.db.loyaltySetting.upsert({ where: { id: 1 }, create: { id: 1, ...patch }, update: patch });
    return { amountStep: row.amountStep, pointsPerStep: row.pointsPerStep };
  }

  async listRules(page: PageRequest): Promise<Page<RewardRule>> {
    const [rows, total] = await Promise.all([
      this.prisma.db.rewardRule.findMany({ include, orderBy: { id: 'asc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.rewardRule.count(),
    ]);
    return toPage(rows.map(toRule), total, page);
  }

  async listActiveRules() {
    return (await this.prisma.db.rewardRule.findMany({ where: { isActive: true }, include, orderBy: { id: 'asc' } })).map(toRule);
  }

  async findRule(id: number) {
    const row = await this.prisma.db.rewardRule.findUnique({ where: { id }, include });
    return row ? toRule(row) : null;
  }

  async createRule(data: NewRule) {
    const { productIds, ...rest } = data;
    const row = await this.prisma.db.rewardRule.create({
      data: { ...rest, rewardRuleProducts: { create: productIds.map((productId) => ({ productId })) } },
      include,
    });
    return toRule(row);
  }

  async updateRule(id: number, patch: RulePatch) {
    return toRule(await this.prisma.db.rewardRule.update({ where: { id }, data: patch, include }));
  }

  counters(userId: number): Promise<UserCounters | null> {
    return this.prisma.db.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true, totalCups: true } });
  }

  addCounters(userId: number, points: number, cups: number): Promise<UserCounters> {
    return this.prisma.db.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points }, totalCups: { increment: cups } },
      select: { loyaltyPoints: true, totalCups: true },
    });
  }

  async subtractCounters(userId: number, points: number, cups: number) {
    await this.prisma.db.$executeRaw`UPDATE "user" SET "loyaltyPoints" = GREATEST("loyaltyPoints" - ${points}, 0), "totalCups" = GREATEST("totalCups" - ${cups}, 0) WHERE "id" = ${userId}`;
  }

  async voucherStats(userId: number, now: Date) {
    const mine = { scope: 'PERSONAL' as const, userId };
    const [granted, usable] = await Promise.all([
      this.prisma.db.promotion.count({ where: mine }),
      this.prisma.db.promotion.count({ where: { ...mine, isActive: true, startsAt: { lte: now }, endsAt: { gte: now }, promotionUsages: { none: { releasedAt: null } } } }),
    ]);
    return { granted, usable };
  }
}
