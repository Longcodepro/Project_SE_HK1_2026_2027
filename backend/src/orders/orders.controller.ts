import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

interface RequestWithUser {
  user: { userId: string; email: string };
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get('me')
  findMine(@Req() req: RequestWithUser) {
    return this.ordersService.findMine(req.user.userId);
  }
}
