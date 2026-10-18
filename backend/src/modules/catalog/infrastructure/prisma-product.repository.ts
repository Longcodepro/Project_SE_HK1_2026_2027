import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Product, ProductSpec, ProductStatus } from '../domain/product';
import { ProductRepository } from '../domain/product.repository';

const include = { category: true, productSizes: true, productToppings: { include: { topping: true } } } satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

const SIZE_ORDER = { S: 0, M: 1, L: 2 };

const toProduct = ({ productSizes, productToppings, category, ...p }: Row): Product => ({
  ...p,
  category: { id: category.id, name: category.name, isVisible: category.isVisible },
  sizes: productSizes
    .map((s) => ({ sizeCode: s.sizeCode, price: s.price, volumeMl: s.volumeMl }))
    .sort((a, b) => SIZE_ORDER[a.sizeCode] - SIZE_ORDER[b.sizeCode]),
  toppings: productToppings.map((t) => t.topping).sort((a, b) => a.id - b.id),
});

// Cột @db.Date so với chuỗi ngày để không phụ thuộc múi giờ của phiên kết nối
const dateStr = (d: Date) => d.toISOString().slice(0, 10);

const specData = (s: ProductSpec) => ({
  categoryId: s.categoryId,
  name: s.name,
  description: s.description,
  imageUrl: s.imageUrl,
  allowHot: s.allowHot,
  allowCold: s.allowCold,
  defaultTemperature: s.defaultTemperature,
  maxPerTopping: s.maxPerTopping,
  maxToppingTotal: s.maxToppingTotal,
  iceMin: s.iceMin,
  iceMax: s.iceMax,
  iceDefault: s.iceDefault,
  sugarMin: s.sugarMin,
  sugarMax: s.sugarMax,
  sugarDefault: s.sugarDefault,
});

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listOnMenu(filter: { search?: string; categoryId?: number }) {
    const rows = await this.prisma.db.product.findMany({
      where: {
        status: { not: 'LOCKED' },
        category: { isVisible: true },
        ...(filter.categoryId !== undefined && { categoryId: filter.categoryId }),
        ...(filter.search && { name: { contains: filter.search, mode: 'insensitive' } }),
      },
      include,
      orderBy: { id: 'asc' },
    });
    return rows.map(toProduct);
  }

  async findById(id: number) {
    const row = await this.prisma.db.product.findUnique({ where: { id }, include });
    return row ? toProduct(row) : null;
  }

  async findManyByIds(ids: number[]) {
    return (await this.prisma.db.product.findMany({ where: { id: { in: ids } }, include })).map(toProduct);
  }

  async listAll(page: PageRequest): Promise<Page<Product>> {
    const [rows, total] = await Promise.all([
      this.prisma.db.product.findMany({ include, orderBy: { id: 'asc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.product.count(),
    ]);
    return toPage(rows.map(toProduct), total, page);
  }

  async create(spec: ProductSpec) {
    const row = await this.prisma.db.product.create({
      data: {
        ...specData(spec),
        productSizes: { create: spec.sizes },
        productToppings: { create: spec.toppingIds.map((toppingId) => ({ toppingId })) },
      },
      include,
    });
    return toProduct(row);
  }

  async update(id: number, spec: ProductSpec) {
    const row = await this.prisma.db.product.update({
      where: { id },
      data: {
        ...specData(spec),
        productSizes: { deleteMany: {}, create: spec.sizes },
        productToppings: { deleteMany: {}, create: spec.toppingIds.map((toppingId) => ({ toppingId })) },
      },
      include,
    });
    return toProduct(row);
  }

  async setStatus(id: number, status: ProductStatus) {
    return toProduct(await this.prisma.db.product.update({ where: { id }, data: { status }, include }));
  }

  async setDailyStock(id: number, quantity: number, today: Date) {
    const row = await this.prisma.db.product.update({
      where: { id },
      data: { dailyQuota: quantity, stockRemaining: quantity, stockDate: today, stockVersion: { increment: 1 } },
      include,
    });
    return toProduct(row);
  }

  reuseDailyStock(today: Date) {
    return this.prisma.db.$executeRaw`UPDATE "product" SET "stockRemaining" = "dailyQuota", "stockDate" = ${dateStr(today)}::date, "stockVersion" = "stockVersion" + 1 WHERE "status" <> 'LOCKED'`;
  }

  async reserve(productId: number, quantity: number, today: Date) {
    // Một câu UPDATE có điều kiện: hai khách đặt cùng lúc không thể làm số ly xuống âm (BR50, BR53)
    const result = await this.prisma.db.product.updateMany({
      where: { id: productId, status: 'ON_SALE', stockDate: today, stockRemaining: { gte: quantity } },
      data: { stockRemaining: { decrement: quantity }, stockVersion: { increment: 1 } },
    });
    return result.count === 1;
  }

  async release(productId: number, quantity: number, today: Date) {
    await this.prisma.db.$executeRaw`UPDATE "product" SET "stockRemaining" = LEAST("stockRemaining" + ${quantity}, "dailyQuota"), "stockVersion" = "stockVersion" + 1 WHERE "id" = ${productId} AND "stockDate" = ${dateStr(today)}::date`;
  }
}
