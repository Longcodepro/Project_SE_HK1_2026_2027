import { Injectable } from '@nestjs/common';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Refund, WalletTransaction, WalletTxType, Withdrawal, WithdrawalStatus } from '../domain/wallet';
import { NewRefund, NewWithdrawal, RefundRepository, WalletRepository, WithdrawalWithUser } from '../domain/wallet.repository';

const userSelect = { select: { id: true, phone: true, fullName: true, email: true } } as const;

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async balance(userId: number) {
    const u = await this.prisma.db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
    return u ? u.walletBalance : null;
  }

  transactions(userId: number): Promise<WalletTransaction[]> {
    return this.prisma.db.walletTransaction.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      select: { id: true, type: true, amount: true, refundId: true, withdrawalId: true, createdAt: true },
    });
  }

  async credit(userId: number, amount: number, tx: { type: WalletTxType; refundId?: number; withdrawalId?: number }) {
    await this.prisma.db.user.update({ where: { id: userId }, data: { walletBalance: { increment: amount } } });
    await this.prisma.db.walletTransaction.create({ data: { userId, type: tx.type, amount, refundId: tx.refundId, withdrawalId: tx.withdrawalId } });
  }

  async debitIfEnough(userId: number, amount: number, tx: { type: WalletTxType; withdrawalId: number }) {
    const result = await this.prisma.db.user.updateMany({ where: { id: userId, walletBalance: { gte: amount } }, data: { walletBalance: { decrement: amount } } });
    if (result.count !== 1) return false;
    await this.prisma.db.walletTransaction.create({ data: { userId, type: tx.type, amount, withdrawalId: tx.withdrawalId } });
    return true;
  }

  createWithdrawal(data: NewWithdrawal): Promise<Withdrawal> {
    return this.prisma.db.withdrawalRequest.create({ data });
  }

  listWithdrawalsOfUser(userId: number): Promise<Withdrawal[]> {
    return this.prisma.db.withdrawalRequest.findMany({ where: { userId }, orderBy: { id: 'desc' } });
  }

  async listWithdrawals(filter: { status?: WithdrawalStatus }, page: PageRequest): Promise<Page<WithdrawalWithUser>> {
    const where = filter.status ? { status: filter.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.db.withdrawalRequest.findMany({ where, include: { user: userSelect }, orderBy: { id: 'desc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.withdrawalRequest.count({ where }),
    ]);
    return toPage(items, total, page);
  }

  async lockWithdrawal(id: number) {
    await this.prisma.db.$queryRaw`SELECT "id" FROM "withdrawal_request" WHERE "id" = ${id} FOR UPDATE`;
    return this.prisma.db.withdrawalRequest.findUnique({ where: { id }, include: { user: userSelect } });
  }

  updateWithdrawal(id: number, patch: Parameters<WalletRepository['updateWithdrawal']>[1]): Promise<Withdrawal> {
    return this.prisma.db.withdrawalRequest.update({ where: { id }, data: patch });
  }
}

@Injectable()
export class PrismaRefundRepository implements RefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewRefund): Promise<Refund> {
    return this.prisma.db.refund.create({ data });
  }

  async totalRefunded(orderId: number) {
    const agg = await this.prisma.db.refund.aggregate({ where: { orderId }, _sum: { amount: true } });
    return agg._sum.amount ?? 0;
  }
}
