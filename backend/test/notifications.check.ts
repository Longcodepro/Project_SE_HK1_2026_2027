import * as assert from 'assert';
import { SendNotificationUseCase } from '../src/modules/notifications/application/send-notification.use-case';
import { NotificationRecord } from '../src/modules/notifications/domain/notification';

// Kiểm tra BR28: cổng gửi lỗi thì ghi FAILED chứ không ném lỗi; có email thì gửi thêm email.
(async () => {
  const saved: NotificationRecord[] = [];
  const okSms = { send: async () => {} };
  const badSms = { send: async () => { throw new Error('mạng lỗi'); } };
  const email = { send: async () => {} };
  const repo = { saveMany: async (r: NotificationRecord[]) => { saved.push(...r); } };
  const input = { userId: 1, phone: '0900000000', event: 'ORDER_CREATED' as const, content: 'xin chào' };

  await new SendNotificationUseCase(okSms, email, repo).execute(input);
  assert.deepStrictEqual(saved.map((r) => [r.channel, r.status]), [['SMS', 'SENT']]);

  saved.length = 0;
  await new SendNotificationUseCase(badSms, email, repo).execute({ ...input, email: 'a@b.vn' });
  assert.deepStrictEqual(saved.map((r) => [r.channel, r.status]), [['SMS', 'FAILED'], ['EMAIL', 'SENT']]);
  console.log('notifications.check OK');
})();
