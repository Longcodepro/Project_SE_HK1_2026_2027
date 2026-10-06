import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

interface RequestWithUser {
  user: { userId: string; email: string };
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  pay(
    @Req() req: RequestWithUser,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.pay(req.user.userId, idempotencyKey, dto);
  }
}
