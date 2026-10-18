import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { OrderDetail, OrderStatus } from '../domain/order';
import { NewOrder, OrderPatch, OrderRepository, OrderSummary } from '../domain/order.repository';

const include = {
  user: { select: { id: true, phone: true, fullName: true, email: true } },
  promotion: { select: { discountType: true, discountValue: true, maxDiscountAmount: true } },
  orderItems: { include: { orderItemToppings: true }, orderBy: { id: 'asc' } },
  payments: { orderBy: { id: 'asc' } },
  refunds: { orderBy: { id: 'asc' } },
  serviceFeedback: true,
} satisfies Prisma.OrderInclude;
type Row = Prisma.OrderGetPayload<{ include: typeof include }>;

const toDetail = (r: Row): OrderDetail => ({
  id: r.id,
  orderCode: r.orderCode,
  userId: r.userId,
  user: r.user,
  promotionId: r.promotionId,
  promotionCode: r.promotionCode,
  promotion: r.promotion,
  status: r.status,
  subtotal: r.subtotal,
  discountAmount: r.discountAmount,
  totalAmount: r.totalAmount,
  pointsAwarded: r.pointsAwarded,
  pickupCode: r.pickupCode,
  cancelReason: r.cancelReason,
  cancelledByUserId: r.cancelledByUserId,
  cancelNote: r.cancelNote,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  items: r.orderItems.map(({ orderItemToppings, orderId: _o, ...i }) => ({
    ...i,
    toppings: orderItemToppings.map((t) => ({ toppingId: t.toppingId, toppingName: t.toppingName, price: t.price, quantity: t.quantity })),
  })),
  payments: r.payments.map(({ orderId: _o, idempotencyKey: _k, ...p }) => p),
  refunds: r.refunds.map(({ orderId: _o, ...x }) => x),
  feedback: r.serviceFeedback ? { rating: r.serviceFeedback.rating, comment: r.serviceFeedback.comment, createdAt: r.serviceFeedback.createdAt } : null,
});

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NewOrder) {
    const { items, ...order } = data;
    const row = await this.prisma.db.order.create({
      data: {
        ...order,
        orderItems: {
          create: items.map(({ toppings, ...i }) => ({
            ...i,
            sizeCode: i.sizeCode as 'S' | 'M' | 'L',
            temperature: i.temperature as 'HOT' | 'COLD',
            orderItemToppings: { create: toppings },
          })),
        },
      },
      include,
    });
    return toDetail(row);
  }

  async findById(id: number) {
    const row = await this.prisma.db.order.findUnique({ where: { id }, include });
    return row ? toDetail(row) : null;
  }

  async lockById(id: number) {
    await this.prisma.db.$queryRaw`SELECT "id" FROM "order" WHERE "id" = ${id} FOR UPDATE`;
    return this.findById(id);
  }

  async findByPickupCode(code: string) {
    const row = await this.prisma.db.order.findUnique({ where: { pickupCode: code }, include });
    return row ? toDetail(row) : null;
  }

  async listByUser(userId: number): Promise<OrderSummary[]> {
    const rows = await this.prisma.db.order.findMany({ where: { userId }, include: { orderItems: { select: { quantity: true } } }, orderBy: { id: 'desc' } });
    return rows.map(({ orderItems, ...o }) => ({ id: o.id, orderCode: o.orderCode, status: o.status, totalAmount: o.totalAmount, createdAt: o.createdAt, itemCount: orderItems.reduce((s, i) => s + i.quantity, 0) }));
  }

  async listAll(filter: { status?: OrderStatus }, page: PageRequest): Promise<Page<OrderSummary>> {
    const where = filter.status ? { status: filter.status } : {};
    const [rows, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where,
        include: { orderItems: { select: { quantity: true } }, user: { select: { id: true, phone: true, fullName: true } } },
        orderBy: { id: 'desc' },
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
      }),
      this.prisma.db.order.count({ where }),
    ]);
    const items = rows.map(({ orderItems, user, ...o }) => ({
      id: o.id, orderCode: o.orderCode, status: o.status, totalAmount: o.totalAmount, createdAt: o.createdAt,
      itemCount: orderItems.reduce((s, i) => s + i.quantity, 0),
      customer: user,
    }));
    return toPage(items, total, page);
  }

  async update(id: number, patch: OrderPatch) {
    await this.prisma.db.order.update({ where: { id }, data: patch });
  }

  async orderCodeExists(code: string) {
    return (await this.prisma.db.order.count({ where: { orderCode: code } })) > 0;
  }

  async pickupCodeExists(code: string) {
    return (await this.prisma.db.order.count({ where: { pickupCode: code } })) > 0;
  }
}
