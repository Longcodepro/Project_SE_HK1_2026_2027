import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, CUSTOMER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { ListMyVouchersUseCase, ValidatePromotionUseCase } from '../application/customer-promotions.use-cases';
import { PromoCheckQuery } from './dto/promotions.dto';

@ApiTags('promotions')
@Controller('promotions')
@Auth(...CUSTOMER_ONLY)
export class PromotionsController {
  constructor(
    private readonly validate: ValidatePromotionUseCase,
    private readonly mine: ListMyVouchersUseCase,
  ) {}

  @Get('validate')
  check(@CurrentUser() user: AuthUser, @Query() q: PromoCheckQuery) {
    return this.validate.execute({ userId: user.id, ...q });
  }

  @Get('mine')
  myVouchers(@CurrentUser() user: AuthUser) {
    return this.mine.execute(user.id);
  }
}
