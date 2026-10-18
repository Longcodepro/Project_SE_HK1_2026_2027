import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  CompleteWithdrawalUseCase,
  GetRefundedTotalUseCase,
  GetWalletUseCase,
  ListMyWithdrawalsUseCase,
  ListWithdrawalsUseCase,
  RefundToWalletUseCase,
  RejectWithdrawalUseCase,
  RequestWithdrawalUseCase,
} from './application/wallet.use-cases';
import { RefundRepository, WalletRepository } from './domain/wallet.repository';
import { PrismaRefundRepository, PrismaWalletRepository } from './infrastructure/prisma-wallet.repository';
import { AdminWithdrawalsController } from './presentation/admin-withdrawals.controller';
import { WalletController } from './presentation/wallet.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [WalletController, AdminWithdrawalsController],
  providers: [
    GetWalletUseCase,
    RequestWithdrawalUseCase,
    ListMyWithdrawalsUseCase,
    ListWithdrawalsUseCase,
    CompleteWithdrawalUseCase,
    RejectWithdrawalUseCase,
    RefundToWalletUseCase,
    GetRefundedTotalUseCase,
    { provide: WalletRepository, useClass: PrismaWalletRepository },
    { provide: RefundRepository, useClass: PrismaRefundRepository },
  ],
  // Module đơn hàng dùng RefundToWalletUseCase khi hủy đơn và xử lý món không làm được
  exports: [RefundToWalletUseCase, GetRefundedTotalUseCase],
})
export class WalletModule {}
