import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, STAFF_UP } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { ListFeedbackUseCase } from '../application/feedback.use-cases';
import { CancelOrderUseCase, CompleteOrderUseCase, UpdateOrderStatusUseCase } from '../application/order-actions.use-cases';
import { FindOrderByPickupCodeUseCase, GetAdminOrderUseCase, ListAdminOrdersUseCase } from '../application/order-queries.use-cases';
import { CompleteOrderDto, FeedbackQuery, OrderListQuery, StaffCancelDto, UpdateStatusDto } from './dto/orders.dto';

@ApiTags('admin-orders')
@Controller('admin')
@Auth(...STAFF_UP)
export class AdminOrdersController {
  constructor(
    private readonly list: ListAdminOrdersUseCase,
    private readonly detail: GetAdminOrderUseCase,
    private readonly byPickup: FindOrderByPickupCodeUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    private readonly complete: CompleteOrderUseCase,
    private readonly cancel: CancelOrderUseCase,
    private readonly feedback: ListFeedbackUseCase,
  ) {}

  @Get('orders')
  orders(@Query() q: OrderListQuery) {
    return this.list.execute({ status: q.status }, { page: q.page, pageSize: q.pageSize });
  }

  // Phải đứng trước 'orders/:id'
  @Get('orders/by-pickup-code/:code')
  pickup(@Param('code') code: string) {
    return this.byPickup.execute(code);
  }

  @Get('orders/:id')
  order(@Param('id', ParseIntPipe) id: number) {
    return this.detail.execute(id);
  }

  @Patch('orders/:id/status')
  status(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.updateStatus.execute(id, dto.status);
  }

  @Post('orders/:id/complete')
  @HttpCode(200)
  deliver(@Param('id', ParseIntPipe) id: number, @Body() dto: CompleteOrderDto) {
    return this.complete.execute(id, dto.pickupCode);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  cancelOrder(@CurrentUser() staff: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: StaffCancelDto) {
    return this.cancel.execute({ orderId: id, actorId: staff.id, byStaff: true, note: dto.note });
  }

  @Get('feedback')
  feedbackList(@Query() q: FeedbackQuery) {
    return this.feedback.execute({ rating: q.rating }, { page: q.page, pageSize: q.pageSize });
  }
}
