import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth } from '../../../shared/presentation/auth/auth.decorator';
import { PageQuery } from '../../../shared/presentation/page-query.dto';
import { AdminCategoriesUseCases } from '../application/admin-categories.use-cases';
import { CategoryNameDto, SetVisibilityDto } from './dto/catalog.dto';

@ApiTags('admin-categories')
@Controller('admin/categories')
@Auth(...MANAGER_ONLY)
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesUseCases) {}

  @Get()
  list(@Query() q: PageQuery) {
    return this.categories.list({ page: q.page, pageSize: q.pageSize });
  }

  @Post()
  create(@Body() dto: CategoryNameDto) {
    return this.categories.create(dto.name);
  }

  @Patch(':id')
  rename(@Param('id', ParseIntPipe) id: number, @Body() dto: CategoryNameDto) {
    return this.categories.rename(id, dto.name);
  }

  @Patch(':id/visibility')
  visibility(@Param('id', ParseIntPipe) id: number, @Body() dto: SetVisibilityDto) {
    return this.categories.setVisible(id, dto.isVisible);
  }
}
