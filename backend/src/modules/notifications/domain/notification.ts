// 7 mốc thông báo của BR28
export type NotificationEvent =
  | 'ORDER_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'REWARD_ISSUED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_REJECTED';

export type NotificationChannel = 'SMS' | 'EMAIL';
export type NotificationStatus = 'SENT' | 'FAILED';

export interface NotificationRecord {
  userId: number;
  orderId: number | null;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  content: string;
  status: NotificationStatus;
}

export interface NotifyInput {
  userId: number;
  phone: string;
  email?: string | null;
  orderId?: number | null;
  event: NotificationEvent;
  // Nội dung SMS (ngắn). Email dùng emailBody nếu có, không thì dùng lại nội dung SMS.
  content: string;
  emailSubject?: string;
  emailBody?: string;
}
