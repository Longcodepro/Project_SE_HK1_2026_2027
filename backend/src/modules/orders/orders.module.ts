import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { WalletModule } from '../wallet/wallet.module';
import { CreateOrderUseCase } from './application/create-order.use-case';
import { ListFeedbackUseCase, SubmitFeedbackUseCase } from './application/feedback.use-cases';
import { CancelOrderUseCase, CompleteOrderUseCase, UpdateOrderStatusUseCase } from './application/order-actions.use-cases';
import { FindOrderByPickupCodeUseCase, GetAdminOrderUseCase, GetBillUseCase, GetMyOrderUseCase, ListAdminOrdersUseCase, ListMyOrdersUseCase } from './application/order-queries.use-cases';
import { FeedbackRepository } from './domain/feedback.repository';
import { OrderRepository } from './domain/order.repository';
import { PrismaFeedbackRepository } from './infrastructure/prisma-feedback.repository';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { AdminOrdersController } from './presentation/admin-orders.controller';
import { OrdersController } from './presentation/orders.controller';

@Module({
  imports: [CatalogModule, PromotionsModule, LoyaltyModule, WalletModule, NotificationsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [
    CreateOrderUseCase,
    ListMyOrdersUseCase,
    GetMyOrderUseCase,
    GetBillUseCase,
    ListAdminOrdersUseCase,
    GetAdminOrderUseCase,
    FindOrderByPickupCodeUseCase,
    CancelOrderUseCase,
    UpdateOrderStatusUseCase,
    CompleteOrderUseCase,
    SubmitFeedbackUseCase,
    ListFeedbackUseCase,
    { provide: OrderRepository, useClass: PrismaOrderRepository },
    { provide: FeedbackRepository, useClass: PrismaFeedbackRepository },
  ],
  // Module thanh toán dùng OrderRepository để đổi trạng thái đơn và GetBillUseCase để gửi hóa đơn
  exports: [OrderRepository, GetBillUseCase],
})
export class OrdersModule {}
