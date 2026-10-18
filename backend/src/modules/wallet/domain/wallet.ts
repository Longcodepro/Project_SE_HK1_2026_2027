export type WalletTxType = 'REFUND_IN' | 'WITHDRAW_OUT' | 'WITHDRAW_RETURN';
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';
export type DestinationType = 'EWALLET' | 'CARD' | 'BANK';
export type RefundReason = 'CANCEL' | 'MISSING_ITEM';

// BR44: rút tối thiểu 10.000đ
export const MIN_WITHDRAWAL = 10000;

export interface WalletTransaction {
  id: number;
  type: WalletTxType;
  amount: number;
  refundId: number | null;
  withdrawalId: number | null;
  createdAt: Date;
}

export interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  destinationType: DestinationType;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  status: WithdrawalStatus;
  rejectReason: string | null;
  transferRef: string | null;
  handledByUserId: number | null;
  handledAt: Date | null;
  createdAt: Date;
}

export interface Refund {
  id: number;
  orderId: number;
  paymentId: number;
  amount: number;
  reason: RefundReason;
  createdByUserId: number;
  note: string | null;
  createdAt: Date;
}
