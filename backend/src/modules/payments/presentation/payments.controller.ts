import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, CUSTOMER_ONLY } from '../../../shared/domain/auth-user';
import { BadRequestError } from '../../../shared/domain/domain.error';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { PayOrderUseCase } from '../application/pay.use-case';
import { isCardExpired } from '../domain/payment';
import { PayDto } from './dto/pay.dto';

@ApiTags('payments')
@Controller('payments')
@Auth(...CUSTOMER_ONLY)
export class PaymentsController {
  constructor(private readonly pay: PayOrderUseCase) {}

  @Post()
  payOrder(@CurrentUser() user: AuthUser, @Headers('idempotency-key') idempotencyKey: string, @Body() dto: PayDto) {
    if (dto.card && isCardExpired(dto.card.expiry)) throw new BadRequestError('Thẻ đã hết hạn');
    return this.pay.execute({ userId: user.id, orderId: dto.orderId, method: dto.method, card: dto.card, idempotencyKey });
  }
}
