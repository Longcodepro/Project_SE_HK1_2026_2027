import { Injectable, Logger } from '@nestjs/common';
import { EmailGateway, SmsGateway } from '../domain/gateways';
import { NotificationRecord, NotifyInput } from '../domain/notification';
import { NotificationRepository } from '../domain/notification.repository';

// Luôn gửi SMS, gửi thêm email nếu khách có email. Lỗi gửi chỉ ghi FAILED, không bao giờ làm hỏng nghiệp vụ gọi nó (BR28).
@Injectable()
export class SendNotificationUseCase {
  private readonly log = new Logger(SendNotificationUseCase.name);

  constructor(
    private readonly sms: SmsGateway,
    private readonly email: EmailGateway,
    private readonly repo: NotificationRepository,
  ) {}

  async execute(input: NotifyInput): Promise<void> {
    const base = { userId: input.userId, orderId: input.orderId ?? null, event: input.event };
    const records: NotificationRecord[] = [];

    records.push({ ...base, channel: 'SMS', recipient: input.phone, content: input.content, status: await this.attempt(() => this.sms.send(input.phone, input.content)) });
    if (input.email) {
      const body = input.emailBody ?? input.content;
      const subject = input.emailSubject ?? 'Thông báo từ BrewLite';
      records.push({ ...base, channel: 'EMAIL', recipient: input.email, content: body, status: await this.attempt(() => this.email.send(input.email!, subject, body)) });
    }

    try {
      await this.repo.saveMany(records);
    } catch (e) {
      this.log.error(`Không lưu được lịch sử thông báo: ${(e as Error).message}`);
    }
  }

  private async attempt(send: () => Promise<void>): Promise<'SENT' | 'FAILED'> {
    try {
      await send();
      return 'SENT';
    } catch (e) {
      this.log.warn(`Gửi thông báo lỗi: ${(e as Error).message}`);
      return 'FAILED';
    }
  }
}
