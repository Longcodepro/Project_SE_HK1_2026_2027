import { Module } from '@nestjs/common';
import { SendNotificationUseCase } from './application/send-notification.use-case';
import { EmailGateway, SmsGateway } from './domain/gateways';
import { NotificationRepository } from './domain/notification.repository';
import { MockEmailGateway, MockSmsGateway } from './infrastructure/mock-gateways';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';

@Module({
  providers: [
    SendNotificationUseCase,
    { provide: SmsGateway, useClass: MockSmsGateway },
    { provide: EmailGateway, useClass: MockEmailGateway },
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
  ],
  exports: [SendNotificationUseCase, SmsGateway],
})
export class NotificationsModule {}
