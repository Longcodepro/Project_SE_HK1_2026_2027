import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { NotificationRecord } from '../domain/notification';
import { NotificationRepository } from '../domain/notification.repository';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMany(records: NotificationRecord[]) {
    await this.prisma.db.notification.createMany({ data: records });
  }
}
