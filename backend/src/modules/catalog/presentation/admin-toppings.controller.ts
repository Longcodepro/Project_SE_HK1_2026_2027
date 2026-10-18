import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth } from '../../../shared/presentation/auth/auth.decorator';
import { PageQuery } from '../../../shared/presentation/page-query.dto';
import { AdminToppingsUseCases } from '../application/admin-toppings.use-cases';
import { CreateToppingDto, SetAvailabilityDto, UpdateToppingDto } from './dto/catalog.dto';

@ApiTags('admin-toppings')
@Controller('admin/toppings')
@Auth(...MANAGER_ONLY)
export class AdminToppingsController {
  constructor(private readonly toppings: AdminToppingsUseCases) {}

  @Get()
  list(@Query() q: PageQuery) {
    return this.toppings.list({ page: q.page, pageSize: q.pageSize });
  }

  @Post()
  create(@Body() dto: CreateToppingDto) {
    return this.toppings.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateToppingDto) {
    return this.toppings.update(id, dto);
  }

  @Patch(':id/availability')
  availability(@Param('id', ParseIntPipe) id: number, @Body() dto: SetAvailabilityDto) {
    return this.toppings.setAvailable(id, dto.isAvailable);
  }
}
