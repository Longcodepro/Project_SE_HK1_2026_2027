import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, CUSTOMER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { GetWalletUseCase, ListMyWithdrawalsUseCase, RequestWithdrawalUseCase } from '../application/wallet.use-cases';
import { RequestWithdrawalDto } from './dto/wallet.dto';

@ApiTags('wallet')
@Controller('wallet')
@Auth(...CUSTOMER_ONLY)
export class WalletController {
  constructor(
    private readonly getWallet: GetWalletUseCase,
    private readonly requestWithdrawal: RequestWithdrawalUseCase,
    private readonly myWithdrawals: ListMyWithdrawalsUseCase,
  ) {}

  @Get()
  wallet(@CurrentUser() user: AuthUser) {
    return this.getWallet.execute(user.id);
  }

  @Post('withdrawals')
  withdraw(@CurrentUser() user: AuthUser, @Body() dto: RequestWithdrawalDto) {
    return this.requestWithdrawal.execute(user.id, dto);
  }

  @Get('withdrawals')
  withdrawals(@CurrentUser() user: AuthUser) {
    return this.myWithdrawals.execute(user.id);
  }
}
