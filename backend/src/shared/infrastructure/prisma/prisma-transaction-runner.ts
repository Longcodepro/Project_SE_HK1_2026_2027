import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../domain/transaction-runner';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionRunner implements TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.inTransaction(work);
  }
}
