import { Page, PageRequest } from '../../../shared/domain/page';

export interface FeedbackRow {
  id: number;
  orderId: number;
  orderCode: string;
  customer: { id: number; phone: string; fullName: string };
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export abstract class FeedbackRepository {
  abstract create(data: { orderId: number; userId: number; rating: number; comment: string | null }): Promise<void>;
  abstract list(filter: { rating?: number }, page: PageRequest): Promise<Page<FeedbackRow>>;
}
