import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { buildBill } from '../domain/bill';
import { OrderDetail, OrderStatus } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import { toCustomerView, toStaffView } from './order-view';

// Đơn không phải của khách thì coi như không tồn tại (404), không để lộ đơn của người khác
const ownOrder = async (orders: OrderRepository, userId: number, id: number): Promise<OrderDetail> => {
  const order = await orders.findById(id);
  if (!order || order.userId !== userId) throw new NotFoundError('Đơn hàng không tồn tại');
  return order;
};

// UC24 Lịch sử đơn, mới nhất trước
@Injectable()
export class ListMyOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  execute(userId: number) {
    return this.orders.listByUser(userId);
  }
}

// UC25, UC26 Chi tiết đơn của khách
@Injectable()
export class GetMyOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(userId: number, id: number) {
    return toCustomerView(await ownOrder(this.orders, userId, id));
  }
}

// UC25 Hóa đơn (BR38). Đơn chưa thanh toán thì chưa có hóa đơn (409).
@Injectable()
export class GetBillUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(userId: number, id: number) {
    return this.forOrder(await ownOrder(this.orders, userId, id));
  }

  forOrder(order: OrderDetail) {
    const bill = buildBill(order);
    if (!bill) throw new ConflictError('Đơn chưa thanh toán nên chưa có hóa đơn');
    return bill;
  }
}

// UC30, UC31 Danh sách đơn cho quản trị, lọc theo trạng thái
@Injectable()
export class ListAdminOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  execute(filter: { status?: OrderStatus }, page: PageRequest) {
    return this.orders.listAll(filter, page);
  }
}

// UC32, UC33 Chi tiết đơn cho quản trị, kèm thanh toán và hoàn tiền
@Injectable()
export class GetAdminOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(id: number) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError('Đơn hàng không tồn tại');
    return toStaffView(order);
  }
}

// UC35 Tra đơn theo mã nhận hàng
@Injectable()
export class FindOrderByPickupCodeUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(code: string) {
    const order = await this.orders.findByPickupCode(code);
    if (!order) throw new NotFoundError('Không có đơn nào với mã nhận hàng này');
    return toStaffView(order);
  }
}
