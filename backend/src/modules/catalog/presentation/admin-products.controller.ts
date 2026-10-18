import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MANAGER_ONLY, STAFF_UP } from '../../../shared/domain/auth-user';
import { Auth } from '../../../shared/presentation/auth/auth.decorator';
import { PageQuery } from '../../../shared/presentation/page-query.dto';
import {
  CreateProductUseCase,
  ListAdminProductsUseCase,
  ReuseDailyStockUseCase,
  SetDailyStockUseCase,
  SetProductLockedUseCase,
  SetSaleStatusUseCase,
  UpdateProductUseCase,
} from '../application/admin-products.use-cases';
import { CreateProductDto, SetDailyStockDto, SetLockedDto, SetSaleStatusDto, UpdateProductDto } from './dto/catalog.dto';

@ApiTags('admin-products')
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly list: ListAdminProductsUseCase,
    private readonly create: CreateProductUseCase,
    private readonly update: UpdateProductUseCase,
    private readonly lock: SetProductLockedUseCase,
    private readonly saleStatus: SetSaleStatusUseCase,
    private readonly dailyStock: SetDailyStockUseCase,
    private readonly reuseStock: ReuseDailyStockUseCase,
  ) {}

  @Get()
  @Auth(...STAFF_UP)
  findAll(@Query() q: PageQuery) {
    return this.list.execute({ page: q.page, pageSize: q.pageSize });
  }

  @Post()
  @Auth(...MANAGER_ONLY)
  add(@Body() dto: CreateProductDto) {
    return this.create.execute(dto as never);
  }

  @Post('daily-stock/reuse')
  @HttpCode(200)
  @Auth(...MANAGER_ONLY)
  reuse() {
    return this.reuseStock.execute();
  }

  @Patch(':id')
  @Auth(...MANAGER_ONLY)
  edit(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.update.execute(id, dto as never);
  }

  @Patch(':id/lock')
  @Auth(...MANAGER_ONLY)
  setLocked(@Param('id', ParseIntPipe) id: number, @Body() dto: SetLockedDto) {
    return this.lock.execute(id, dto.isLocked);
  }

  @Patch(':id/sale-status')
  @Auth(...STAFF_UP)
  setSaleStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: SetSaleStatusDto) {
    return this.saleStatus.execute(id, dto.status);
  }

  @Put(':id/daily-stock')
  @Auth(...MANAGER_ONLY)
  setDailyStock(@Param('id', ParseIntPipe) id: number, @Body() dto: SetDailyStockDto) {
    return this.dailyStock.execute(id, dto.quantity);
  }
}
