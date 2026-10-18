import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { CompleteWithdrawalUseCase, ListWithdrawalsUseCase, RejectWithdrawalUseCase } from '../application/wallet.use-cases';
import { CompleteWithdrawalDto, RejectWithdrawalDto, WithdrawalQuery } from './dto/wallet.dto';

@ApiTags('admin-withdrawals')
@Controller('admin/withdrawals')
@Auth(...MANAGER_ONLY)
export class AdminWithdrawalsController {
  constructor(
    private readonly list: ListWithdrawalsUseCase,
    private readonly complete: CompleteWithdrawalUseCase,
    private readonly reject: RejectWithdrawalUseCase,
  ) {}

  @Get()
  findAll(@Query() q: WithdrawalQuery) {
    return this.list.execute({ status: q.status }, { page: q.page, pageSize: q.pageSize });
  }

  @Patch(':id/complete')
  @HttpCode(200)
  done(@CurrentUser() manager: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CompleteWithdrawalDto) {
    return this.complete.execute(manager.id, id, dto.transferRef);
  }

  @Patch(':id/reject')
  @HttpCode(200)
  deny(@CurrentUser() manager: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: RejectWithdrawalDto) {
    return this.reject.execute(manager.id, id, dto.rejectReason);
  }
}
