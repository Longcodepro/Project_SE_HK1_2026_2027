import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationsModule, UsersModule, AuthModule, CatalogModule, PromotionsModule, LoyaltyModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
