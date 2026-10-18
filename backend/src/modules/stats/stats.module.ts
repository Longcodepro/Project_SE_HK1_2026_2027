import { Module } from '@nestjs/common';
import { GetOrdersByStatusUseCase, GetRevenueStatsUseCase, GetTopProductsUseCase, GetTopToppingsUseCase } from './application/stats.use-cases';
import { StatsRepository } from './domain/stats.repository';
import { PrismaStatsRepository } from './infrastructure/prisma-stats.repository';
import { StatsController } from './presentation/stats.controller';

@Module({
  controllers: [StatsController],
  providers: [GetRevenueStatsUseCase, GetTopProductsUseCase, GetTopToppingsUseCase, GetOrdersByStatusUseCase, { provide: StatsRepository, useClass: PrismaStatsRepository }],
})
export class StatsModule {}
