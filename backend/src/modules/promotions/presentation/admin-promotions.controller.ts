import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth } from '../../../shared/presentation/auth/auth.decorator';
import { CreatePromotionUseCase, DeactivatePromotionUseCase, ListPromotionsUseCase, UpdatePromotionUseCase } from '../application/admin-promotions.use-cases';
import { CreatePromotionDto, PromotionListQuery, UpdatePromotionDto } from './dto/promotions.dto';

@ApiTags('admin-promotions')
@Controller('admin/promotions')
@Auth(...MANAGER_ONLY)
export class AdminPromotionsController {
  constructor(
    private readonly list: ListPromotionsUseCase,
    private readonly create: CreatePromotionUseCase,
    private readonly update: UpdatePromotionUseCase,
    private readonly deactivate: DeactivatePromotionUseCase,
  ) {}

  @Get()
  findAll(@Query() q: PromotionListQuery) {
    return this.list.execute({ status: q.status, scope: q.scope }, { page: q.page, pageSize: q.pageSize });
  }

  @Post()
  add(@Body() dto: CreatePromotionDto) {
    return this.create.execute(dto);
  }

  @Patch(':id')
  edit(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.update.execute(id, dto);
  }

  @Patch(':id/deactivate')
  off(@Param('id', ParseIntPipe) id: number) {
    return this.deactivate.execute(id);
  }
}
