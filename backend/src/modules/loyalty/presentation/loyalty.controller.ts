import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, CUSTOMER_ONLY, MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { PageQuery } from '../../../shared/presentation/page-query.dto';
import { GetMyPointsUseCase, GetUserPointsUseCase, LoyaltySettingsUseCases, RewardRulesUseCases } from '../application/loyalty.use-cases';
import { CreateRewardRuleDto, SetRuleActiveDto, UpdateLoyaltySettingsDto, UpdateRewardRuleDto } from './dto/loyalty.dto';

@ApiTags('loyalty')
@Controller()
export class LoyaltyController {
  constructor(
    private readonly myPoints: GetMyPointsUseCase,
    private readonly userPoints: GetUserPointsUseCase,
    private readonly settings: LoyaltySettingsUseCases,
    private readonly rules: RewardRulesUseCases,
  ) {}

  @Get('users/me/points')
  @Auth(...CUSTOMER_ONLY)
  me(@CurrentUser() user: AuthUser) {
    return this.myPoints.execute(user.id);
  }

  @Get('admin/users/:id/points')
  @Auth(...MANAGER_ONLY)
  ofUser(@Param('id', ParseIntPipe) id: number) {
    return this.userPoints.execute(id);
  }

  @Get('admin/loyalty/settings')
  @Auth(...MANAGER_ONLY)
  getSettings() {
    return this.settings.get();
  }

  @Patch('admin/loyalty/settings')
  @Auth(...MANAGER_ONLY)
  updateSettings(@Body() dto: UpdateLoyaltySettingsDto) {
    return this.settings.update(dto);
  }

  @Get('admin/loyalty/rules')
  @Auth(...MANAGER_ONLY)
  listRules(@Query() q: PageQuery) {
    return this.rules.list({ page: q.page, pageSize: q.pageSize });
  }

  @Post('admin/loyalty/rules')
  @Auth(...MANAGER_ONLY)
  createRule(@Body() dto: CreateRewardRuleDto) {
    return this.rules.create(dto);
  }

  @Patch('admin/loyalty/rules/:id')
  @Auth(...MANAGER_ONLY)
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRewardRuleDto) {
    return this.rules.update(id, dto);
  }

  @Patch('admin/loyalty/rules/:id/active')
  @Auth(...MANAGER_ONLY)
  setActive(@Param('id', ParseIntPipe) id: number, @Body() dto: SetRuleActiveDto) {
    return this.rules.setActive(id, dto.isActive);
  }
}
