export type ItemResolution = 'REFUND_TO_WALLET' | 'EXCHANGE';

export interface NewItemIssue {
  orderId: number;
  orderItemId: number;
  quantity: number;
  resolution: ItemResolution;
  refundId: number | null;
  note: string;
  handledByUserId: number;
}

export interface ItemIssueRow {
  id: number;
  orderId: number;
  orderCode: string;
  orderItemId: number;
  productName: string;
  quantity: number;
  resolution: ItemResolution;
  refundAmount: number | null;
  note: string;
  handledBy: { id: number; fullName: string };
  createdAt: Date;
}

// BR45: chỉ xử lý được khi đơn đã trả tiền và chưa giao
export const ISSUE_ELIGIBLE_STATUSES = ['PAID', 'PREPARING', 'READY'];
