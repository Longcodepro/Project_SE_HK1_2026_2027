import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderSize } from './dto/create-order.dto';

// Phụ thu theo size, thống nhất với frontend ở docs/API-CONTRACT.md
const SIZE_SURCHARGE: Record<OrderSize, number> = {
  [OrderSize.S]: 0,
  [OrderSize.M]: 5000,
  [OrderSize.L]: 10000,
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const toppingIds = [...new Set(dto.items.flatMap((i) => i.toppings ?? []))];

    const [products, toppings] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds } } }),
      this.prisma.topping.findMany({ where: { id: { in: toppingIds } } }),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const toppingById = new Map(toppings.map((t) => [t.id, t]));

    // Gộp số lượng theo từng sản phẩm trước khi so với tồn kho,
    // tránh trường hợp giỏ có 2 dòng cùng một món mà mỗi dòng đều lọt qua
    const qtyByProduct = new Map<string, number>();
    for (const item of dto.items) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
    }

    const lines = dto.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Sản phẩm ${item.productId} không tồn tại`);
      }

      const toppingTotal = (item.toppings ?? []).reduce((sum, id) => {
        const topping = toppingById.get(id);
        if (!topping) {
          throw new NotFoundException(`Topping ${id} không tồn tại`);
        }
        return sum + topping.price;
      }, 0);

      const unitPrice = product.price + SIZE_SURCHARGE[item.size] + toppingTotal;
      return {
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        toppings: item.toppings ?? [],
        lineTotal: unitPrice * item.qty,
      };
    });

    for (const [productId, qty] of qtyByProduct) {
      const product = productById.get(productId)!;
      if (product.stock < qty) {
        throw new HttpException(
          { statusCode: 422, message: `Sản phẩm ${productId} không đủ hàng` },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);

    // Trừ tồn kho và tạo đơn trong cùng một transaction để không bán vượt hàng
    return this.prisma.$transaction(async (tx) => {
      for (const [productId, qty] of qtyByProduct) {
        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        // updateMany trả về 0 nghĩa là có người khác vừa mua mất hàng
        if (updated.count === 0) {
          throw new HttpException(
            { statusCode: 422, message: `Sản phẩm ${productId} không đủ hàng` },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }

      return tx.order.create({
        data: { userId, total, items: { create: lines } },
        include: { items: true },
      });
    });
  }

  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
