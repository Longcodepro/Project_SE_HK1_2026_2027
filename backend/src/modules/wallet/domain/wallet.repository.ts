import { Page, PageRequest } from '../../../shared/domain/page';
import { DestinationType, Refund, RefundReason, WalletTransaction, WalletTxType, Withdrawal, WithdrawalStatus } from './wallet';

export interface NewWithdrawal {
  userId: number;
  amount: number;
  destinationType: DestinationType;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
}

export type WithdrawalWithUser = Withdrawal & { user: { id: number; phone: string; fullName: string; email: string | null } };

export abstract class WalletRepository {
  abstract balance(userId: number): Promise<number | null>;
  abstract transactions(userId: number): Promise<WalletTransaction[]>;
  // Cộng tiền và ghi một dòng lịch sử (BR43)
  abstract credit(userId: number, amount: number, tx: { type: WalletTxType; refundId?: number; withdrawalId?: number }): Promise<void>;
  // Trừ tiền chỉ khi đủ số dư, bằng một câu UPDATE có điều kiện nên hai yêu cầu cùng lúc không làm ví âm (BR53)
  abstract debitIfEnough(userId: number, amount: number, tx: { type: WalletTxType; withdrawalId: number }): Promise<boolean>;
  abstract createWithdrawal(data: NewWithdrawal): Promise<Withdrawal>;
  abstract listWithdrawalsOfUser(userId: number): Promise<Withdrawal[]>;
  abstract listWithdrawals(filter: { status?: WithdrawalStatus }, page: PageRequest): Promise<Page<WithdrawalWithUser>>;
  // Khóa dòng yêu cầu rồi đọc, để hai quản lý bấm cùng lúc chỉ xử lý được một lần
  abstract lockWithdrawal(id: number): Promise<WithdrawalWithUser | null>;
  abstract updateWithdrawal(id: number, patch: Partial<Pick<Withdrawal, 'status' | 'rejectReason' | 'transferRef' | 'handledByUserId' | 'handledAt'>>): Promise<Withdrawal>;
}

export interface NewRefund {
  orderId: number;
  paymentId: number;
  amount: number;
  reason: RefundReason;
  createdByUserId: number;
  note: string | null;
}

export abstract class RefundRepository {
  abstract create(data: NewRefund): Promise<Refund>;
  // Tổng đã hoàn của một đơn, để không hoàn vượt totalAmount (BR45)
  abstract totalRefunded(orderId: number): Promise<number>;
}
