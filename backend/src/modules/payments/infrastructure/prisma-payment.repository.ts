import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Payment } from '../domain/payment';
import { NewPayment, PaymentRepository } from '../domain/payment.repository';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(idempotencyKey: string): Promise<Payment | null> {
    return this.prisma.db.payment.findUnique({ where: { idempotencyKey } });
  }

  create(data: NewPayment): Promise<Payment> {
    return this.prisma.db.payment.create({ data });
  }
}
