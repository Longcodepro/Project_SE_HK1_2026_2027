import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, CUSTOMER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { SubmitFeedbackUseCase } from '../application/feedback.use-cases';
import { CreateOrderUseCase } from '../application/create-order.use-case';
import { CancelOrderUseCase } from '../application/order-actions.use-cases';
import { GetBillUseCase, GetMyOrderUseCase, ListMyOrdersUseCase } from '../application/order-queries.use-cases';
import { CreateOrderDto, CustomerCancelDto, SubmitFeedbackDto } from './dto/orders.dto';

@ApiTags('orders')
@Controller('orders')
@Auth(...CUSTOMER_ONLY)
export class OrdersController {
  constructor(
    private readonly create: CreateOrderUseCase,
    private readonly mine: ListMyOrdersUseCase,
    private readonly detail: GetMyOrderUseCase,
    private readonly bill: GetBillUseCase,
    private readonly cancel: CancelOrderUseCase,
    private readonly feedback: SubmitFeedbackUseCase,
  ) {}

  @Post()
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.create.execute(user.id, dto);
  }

  // Khai báo trước ':id' để 'me' không bị hiểu là một id
  @Get('me')
  myOrders(@CurrentUser() user: AuthUser) {
    return this.mine.execute(user.id);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.detail.execute(user.id, id);
  }

  @Get(':id/bill')
  getBill(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.bill.execute(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancelOrder(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CustomerCancelDto) {
    return this.cancel.execute({ orderId: id, actorId: user.id, byStaff: false, note: dto.note });
  }

  @Post(':id/feedback')
  sendFeedback(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: SubmitFeedbackDto) {
    return this.feedback.execute(user.id, id, dto);
  }
}
