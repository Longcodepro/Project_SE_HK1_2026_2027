import { Payment } from './payment';

export interface NewPayment extends Omit<Payment, 'id' | 'createdAt'> {}

export abstract class PaymentRepository {
  abstract findByKey(idempotencyKey: string): Promise<Payment | null>;
  abstract create(data: NewPayment): Promise<Payment>;
}
