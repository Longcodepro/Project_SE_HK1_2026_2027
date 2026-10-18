import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError, UnprocessableError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { TransactionRunner } from '../../../shared/domain/transaction-runner';
import { SendNotificationUseCase } from '../../notifications/application/send-notification.use-case';
import { DestinationType, MIN_WITHDRAWAL, Refund, RefundReason, WithdrawalStatus } from '../domain/wallet';
import { RefundRepository, WalletRepository, WithdrawalWithUser } from '../domain/wallet.repository';

// UC71 Ví hoàn tiền: số dư và lịch sử biến động
@Injectable()
export class GetWalletUseCase {
  constructor(private readonly wallet: WalletRepository) {}

  async execute(userId: number) {
    const balance = await this.wallet.balance(userId);
    if (balance === null) throw new NotFoundError('Không tìm thấy tài khoản');
    return { balance, transactions: await this.wallet.transactions(userId) };
  }
}

export interface RequestWithdrawalInput {
  amount: number;
  destinationType: DestinationType;
  accountName: string;
  accountNumber: string;
  bankName?: string;
}

// UC72 Yêu cầu rút tiền: trừ ví ngay (giữ chỗ), quản lý chuyển khoản thủ công sau (BR44)
@Injectable()
export class RequestWithdrawalUseCase {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(userId: number, input: RequestWithdrawalInput) {
    if (input.amount < MIN_WITHDRAWAL) throw new BadRequestError(`Số tiền rút tối thiểu ${MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ`);
    const needsBank = input.destinationType !== 'EWALLET';
    if (needsBank && !input.bankName?.trim()) throw new BadRequestError('Thẻ và tài khoản ngân hàng bắt buộc có tên ngân hàng');
    return this.tx.run(async () => {
      const withdrawal = await this.wallet.createWithdrawal({
        userId,
        amount: input.amount,
        destinationType: input.destinationType,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        bankName: needsBank ? input.bankName!.trim() : null,
      });
      if (!(await this.wallet.debitIfEnough(userId, input.amount, { type: 'WITHDRAW_OUT', withdrawalId: withdrawal.id }))) {
        // Ném lỗi trong giao dịch nên yêu cầu vừa tạo bị hoàn tác
        throw new UnprocessableError('Số dư ví không đủ để rút số tiền này');
      }
      return withdrawal;
    });
  }
}

@Injectable()
export class ListMyWithdrawalsUseCase {
  constructor(private readonly wallet: WalletRepository) {}

  execute(userId: number) {
    return this.wallet.listWithdrawalsOfUser(userId);
  }
}

// UC73 Quản lý xem các yêu cầu rút tiền
@Injectable()
export class ListWithdrawalsUseCase {
  constructor(private readonly wallet: WalletRepository) {}

  execute(filter: { status?: WithdrawalStatus }, page: PageRequest) {
    return this.wallet.listWithdrawals(filter, page);
  }
}

abstract class WithdrawalHandler {
  constructor(
    protected readonly wallet: WalletRepository,
    protected readonly tx: TransactionRunner,
    protected readonly notify: SendNotificationUseCase,
  ) {}

  // Khóa dòng, chỉ xử lý được yêu cầu đang PENDING (BR44)
  protected async handle(id: number, work: (w: WithdrawalWithUser) => Promise<void>): Promise<WithdrawalWithUser> {
    const w = await this.tx.run(async () => {
      const locked = await this.wallet.lockWithdrawal(id);
      if (!locked) throw new NotFoundError('Yêu cầu rút tiền không tồn tại');
      if (locked.status !== 'PENDING') throw new ConflictError('Yêu cầu này đã được xử lý');
      await work(locked);
      return locked;
    });
    return w;
  }
}

// UC73 Hoàn tất: quản lý đã chuyển khoản thủ công và nhập mã giao dịch
@Injectable()
export class CompleteWithdrawalUseCase extends WithdrawalHandler {
  constructor(wallet: WalletRepository, tx: TransactionRunner, notify: SendNotificationUseCase) {
    super(wallet, tx, notify);
  }

  async execute(managerId: number, id: number, transferRef: string) {
    const w = await this.handle(id, async (locked) => {
      await this.wallet.updateWithdrawal(locked.id, { status: 'COMPLETED', transferRef, handledByUserId: managerId, handledAt: new Date() });
    });
    await this.notify.execute({
      userId: w.user.id,
      phone: w.user.phone,
      email: w.user.email,
      event: 'WITHDRAWAL_COMPLETED',
      content: `BrewLite: đã chuyển ${w.amount.toLocaleString('vi-VN')}đ về tài khoản ${w.accountNumber} của bạn (mã giao dịch ${transferRef}).`,
    });
    return this.wallet.updateWithdrawal(id, {});
  }
}

// UC73 Từ chối: trả tiền lại ví bằng WITHDRAW_RETURN
@Injectable()
export class RejectWithdrawalUseCase extends WithdrawalHandler {
  constructor(wallet: WalletRepository, tx: TransactionRunner, notify: SendNotificationUseCase) {
    super(wallet, tx, notify);
  }

  async execute(managerId: number, id: number, rejectReason: string) {
    const w = await this.handle(id, async (locked) => {
      await this.wallet.updateWithdrawal(locked.id, { status: 'REJECTED', rejectReason, handledByUserId: managerId, handledAt: new Date() });
      await this.wallet.credit(locked.userId, locked.amount, { type: 'WITHDRAW_RETURN', withdrawalId: locked.id });
    });
    await this.notify.execute({
      userId: w.user.id,
      phone: w.user.phone,
      email: w.user.email,
      event: 'WITHDRAWAL_REJECTED',
      content: `BrewLite: yêu cầu rút ${w.amount.toLocaleString('vi-VN')}đ bị từ chối (${rejectReason}). Tiền đã trả lại ví của bạn.`,
    });
    return this.wallet.updateWithdrawal(id, {});
  }
}

export interface RefundInput {
  orderId: number;
  paymentId: number;
  userId: number; // khách nhận tiền
  amount: number;
  reason: RefundReason;
  actorId: number; // người thực hiện: khách hoặc nhân viên
  note?: string | null;
}

// UC38 Mọi khoản hoàn tiền đều cộng vào ví của khách, không trả về cổng thanh toán (BR16, BR43).
// Gọi trong giao dịch của nghiệp vụ gọi nó (hủy đơn, xử lý món không làm được).
@Injectable()
export class RefundToWalletUseCase {
  constructor(
    private readonly refunds: RefundRepository,
    private readonly wallet: WalletRepository,
  ) {}

  async execute(input: RefundInput): Promise<Refund> {
    const refund = await this.refunds.create({
      orderId: input.orderId,
      paymentId: input.paymentId,
      amount: input.amount,
      reason: input.reason,
      createdByUserId: input.actorId,
      note: input.note ?? null,
    });
    await this.wallet.credit(input.userId, input.amount, { type: 'REFUND_IN', refundId: refund.id });
    return refund;
  }
}

// Dùng cho UC74: tổng đã hoàn của đơn
@Injectable()
export class GetRefundedTotalUseCase {
  constructor(private readonly refunds: RefundRepository) {}

  execute(orderId: number) {
    return this.refunds.totalRefunded(orderId);
  }
}

