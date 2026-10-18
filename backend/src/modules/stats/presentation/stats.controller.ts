import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth } from '../../../shared/presentation/auth/auth.decorator';
import { GetOrdersByStatusUseCase, GetRevenueStatsUseCase, GetTopProductsUseCase, GetTopToppingsUseCase } from '../application/stats.use-cases';
import { StatsQuery } from './dto/stats.dto';

@ApiTags('admin-stats')
@Controller('admin/stats')
@Auth(...MANAGER_ONLY)
export class StatsController {
  constructor(
    private readonly revenue: GetRevenueStatsUseCase,
    private readonly products: GetTopProductsUseCase,
    private readonly toppings: GetTopToppingsUseCase,
    private readonly byStatus: GetOrdersByStatusUseCase,
  ) {}

  @Get('revenue')
  getRevenue(@Query() q: StatsQuery) {
    return this.revenue.execute(q);
  }

  @Get('top-products')
  getTopProducts(@Query() q: StatsQuery) {
    return this.products.execute(q);
  }

  @Get('top-toppings')
  getTopToppings(@Query() q: StatsQuery) {
    return this.toppings.execute(q);
  }

  @Get('orders-by-status')
  getOrdersByStatus(@Query() q: StatsQuery) {
    return this.byStatus.execute(q);
  }
}
