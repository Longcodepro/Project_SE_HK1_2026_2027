import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { WalletModule } from '../wallet/wallet.module';
import { HandleMissingItemUseCase, ListItemIssuesUseCase } from './application/item-issue.use-cases';
import { ItemIssueRepository } from './domain/item-issue.repository';
import { PrismaItemIssueRepository } from './infrastructure/prisma-item-issue.repository';
import { ItemIssuesController } from './presentation/item-issues.controller';

@Module({
  imports: [OrdersModule, WalletModule],
  controllers: [ItemIssuesController],
  providers: [HandleMissingItemUseCase, ListItemIssuesUseCase, { provide: ItemIssueRepository, useClass: PrismaItemIssueRepository }],
})
export class ItemIssuesModule {}
