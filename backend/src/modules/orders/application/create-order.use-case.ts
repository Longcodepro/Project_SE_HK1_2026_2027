import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../catalog/domain/product.repository';
import { ReserveStockUseCase } from '../../catalog/application/stock.use-cases';
import { SendNotificationUseCase } from '../../notifications/application/send-notification.use-case';
import { RecordPromotionUsageUseCase, ResolvePromotionForOrderUseCase } from '../../promotions/application/order-promotions.use-cases';
import { TransactionRunner } from '../../../shared/domain/transaction-runner';
import { generateOrderCode, OrderLineInput, priceLine } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import { toCustomerView } from './order-view';

export interface CreateOrderInput {
  items: OrderLineInput[];
  promotionCode?: string;
  // Thứ tự dòng (bắt đầu từ 0) khách chọn làm ly được tặng, khi dùng mã tặng ly
  freeCupLine?: number;
}

// UC18 Tạo đơn: kiểm từng dòng, tính giá, áp mã, trừ số ly, lưu đơn PENDING. Tất cả trong một giao dịch.
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
    private readonly resolvePromotion: ResolvePromotionForOrderUseCase,
    private readonly recordUsage: RecordPromotionUsageUseCase,
    private readonly reserveStock: ReserveStockUseCase,
    private readonly notify: SendNotificationUseCase,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(userId: number, input: CreateOrderInput) {
    const order = await this.tx.run(async () => {
      const ids = [...new Set(input.items.map((i) => i.productId))];
      const byId = new Map((await this.products.findManyByIds(ids)).map((p) => [p.id, p]));
      const lines = input.items.map((i) => priceLine(i, byId.get(i.productId)));
      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

      const promo = input.promotionCode
        ? await this.resolvePromotion.execute({
            userId,
            code: input.promotionCode,
            subtotal,
            lines: lines.map((l) => ({ productId: l.product.id, unitPrice: l.unitPrice })),
            freeCupLine: input.freeCupLine,
          })
        : null;

      // BR50: trừ số ly trong cùng giao dịch với việc lưu đơn
      await this.reserveStock.execute(lines.map((l) => ({ productId: l.product.id, name: l.product.name, quantity: l.quantity })));

      const discountAmount = promo?.discountAmount ?? 0;
      const created = await this.orders.create({
        orderCode: await this.uniqueOrderCode(),
        userId,
        promotionId: promo?.promotion.id ?? null,
        promotionCode: promo?.promotion.code ?? null,
        subtotal,
        discountAmount,
        totalAmount: subtotal - discountAmount, // BR08
        items: lines.map((l) => ({
          // BR26: lưu ảnh chụp tên, giá, size lúc đặt
          productId: l.product.id,
          productName: l.product.name,
          sizeCode: l.size.sizeCode,
          sizeVolumeMl: l.size.volumeMl,
          unitPrice: l.unitPrice,
          iceLevel: l.iceLevel,
          sugarLevel: l.sugarLevel,
          temperature: l.temperature,
          note: l.note,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
          toppings: l.toppings.map((t) => ({ toppingId: t.topping.id, toppingName: t.topping.name, price: t.topping.price, quantity: t.quantity })),
        })),
      });
      if (promo) await this.recordUsage.execute(promo.promotion.id, userId, created.id); // BR39
      return created;
    });

    await this.notify.execute({
      userId,
      phone: order.user.phone,
      email: order.user.email,
      orderId: order.id,
      event: 'ORDER_CREATED',
      content: `BrewLite: đơn ${order.orderCode} đã được tạo, tổng ${order.totalAmount.toLocaleString('vi-VN')}đ. Vui lòng thanh toán để quán bắt đầu pha.`,
    });
    return toCustomerView(order);
  }

  private async uniqueOrderCode(): Promise<string> {
    for (;;) {
      const code = generateOrderCode();
      if (!(await this.orders.orderCodeExists(code))) return code;
    }
  }
}
