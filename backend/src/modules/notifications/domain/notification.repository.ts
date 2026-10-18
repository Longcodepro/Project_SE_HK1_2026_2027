import { NotificationRecord } from './notification';

export abstract class NotificationRepository {
  abstract saveMany(records: NotificationRecord[]): Promise<void>;
}
