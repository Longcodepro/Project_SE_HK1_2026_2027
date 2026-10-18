import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { UsersModule } from '../users/users.module';
import { AwardLoyaltyUseCase, GrantRewardsUseCase, RevokeLoyaltyUseCase } from './application/award-loyalty.use-cases';
import { GetMyPointsUseCase, GetUserPointsUseCase, LoyaltySettingsUseCases, RewardRulesUseCases } from './application/loyalty.use-cases';
import { LoyaltyRepository } from './domain/loyalty.repository';
import { PrismaLoyaltyRepository } from './infrastructure/prisma-loyalty.repository';
import { LoyaltyController } from './presentation/loyalty.controller';

@Module({
  imports: [UsersModule, NotificationsModule, PromotionsModule],
  controllers: [LoyaltyController],
  providers: [
    GetMyPointsUseCase,
    GetUserPointsUseCase,
    LoyaltySettingsUseCases,
    RewardRulesUseCases,
    GrantRewardsUseCase,
    AwardLoyaltyUseCase,
    RevokeLoyaltyUseCase,
    { provide: LoyaltyRepository, useClass: PrismaLoyaltyRepository },
  ],
  exports: [AwardLoyaltyUseCase, RevokeLoyaltyUseCase],
})
export class LoyaltyModule {}
