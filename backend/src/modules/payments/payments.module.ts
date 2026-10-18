import { Module } from '@nestjs/common';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PayOrderUseCase } from './application/pay.use-case';
import { PaymentGateway } from './domain/payment.gateway';
import { PaymentRepository } from './domain/payment.repository';
import { MockPaymentGateway } from './infrastructure/mock-payment.gateway';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [OrdersModule, LoyaltyModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PayOrderUseCase,
    { provide: PaymentRepository, useClass: PrismaPaymentRepository },
    { provide: PaymentGateway, useClass: MockPaymentGateway },
  ],
})
export class PaymentsModule {}
