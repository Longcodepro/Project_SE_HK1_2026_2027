import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { todayVN } from '../../../shared/domain/vn-time';
import { assertValidSpec, Product, ProductSpec, specOf } from '../domain/product';
import { CategoryRepository } from '../domain/category.repository';
import { ProductRepository } from '../domain/product.repository';
import { ToppingRepository } from '../domain/topping.repository';
import { toAdminView } from './product-view';

const load = async (products: ProductRepository, id: number): Promise<Product> => {
  const product = await products.findById(id);
  if (!product) throw new NotFoundError('Sản phẩm không tồn tại');
  return product;
};

// Mọi trường tùy chọn được điền mặc định ở đây rồi mới kiểm tra chéo
export type ProductSpecInput = Partial<Omit<ProductSpec, 'sizes' | 'toppingIds'>> & Pick<ProductSpec, 'categoryId' | 'name'> & { sizes: ProductSpec['sizes']; toppingIds?: number[] };

export function withDefaults(input: ProductSpecInput): ProductSpec {
  const toppingIds = [...new Set(input.toppingIds ?? [])];
  const allowHot = input.allowHot ?? false;
  const allowCold = input.allowCold ?? true;
  return {
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    sizes: input.sizes,
    toppingIds,
    // BR37: gợi ý mặc định mỗi loại 1, tổng 3 khi có topping
    maxPerTopping: input.maxPerTopping ?? (toppingIds.length ? 1 : 0),
    maxToppingTotal: input.maxToppingTotal ?? (toppingIds.length ? 3 : 0),
    allowHot,
    allowCold,
    defaultTemperature: input.defaultTemperature ?? (allowCold ? 'COLD' : 'HOT'),
    iceMin: input.iceMin ?? 0,
    iceMax: input.iceMax ?? 100,
    iceDefault: input.iceDefault ?? 75,
    sugarMin: input.sugarMin ?? 0,
    sugarMax: input.sugarMax ?? 100,
    sugarDefault: input.sugarDefault ?? 50,
  };
}

// UC40 Danh sách sản phẩm cho quản trị, kể cả món khóa bán
@Injectable()
export class ListAdminProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(page: PageRequest) {
    const result = await this.products.listAll(page);
    const now = new Date();
    return { ...result, items: result.items.map((p) => toAdminView(p, now)) };
  }
}

@Injectable()
class SpecChecker {
  constructor(
    protected readonly categories: CategoryRepository,
    protected readonly toppings: ToppingRepository,
  ) {}

  protected async check(spec: ProductSpec) {
    assertValidSpec(spec);
    if (!(await this.categories.findById(spec.categoryId))) throw new NotFoundError('Danh mục không tồn tại');
    const found = await this.toppings.findByIds(spec.toppingIds);
    if (found.length !== spec.toppingIds.length) throw new NotFoundError('Có topping không tồn tại');
  }
}

// UC41-UC45 Thêm sản phẩm
@Injectable()
export class CreateProductUseCase extends SpecChecker {
  constructor(categories: CategoryRepository, toppings: ToppingRepository, private readonly products: ProductRepository) {
    super(categories, toppings);
  }

  async execute(input: ProductSpecInput) {
    const spec = withDefaults(input);
    await this.check(spec);
    return toAdminView(await this.products.create(spec));
  }
}

// UC46 Sửa sản phẩm: trường nào gửi lên thì đổi, size và topping gửi lên thì thay toàn bộ
@Injectable()
export class UpdateProductUseCase extends SpecChecker {
  constructor(categories: CategoryRepository, toppings: ToppingRepository, private readonly products: ProductRepository) {
    super(categories, toppings);
  }

  async execute(id: number, patch: Partial<ProductSpecInput>) {
    const current = specOf(await load(this.products, id));
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const spec = { ...current, ...defined } as ProductSpec;
    if (spec.toppingIds.length === 0 && patch.toppingIds !== undefined) {
      // Bỏ hết topping: nếu không nói gì về giới hạn thì đưa về 0
      if (patch.maxPerTopping === undefined) spec.maxPerTopping = 0;
      if (patch.maxToppingTotal === undefined) spec.maxToppingTotal = 0;
    }
    spec.toppingIds = [...new Set(spec.toppingIds)];
    await this.check(spec);
    return toAdminView(await this.products.update(id, spec));
  }
}

// UC47 Khóa bán / mở lại: chỉ quản lý. Mở lại về ON_SALE (BR33).
@Injectable()
export class SetProductLockedUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number, isLocked: boolean) {
    const product = await load(this.products, id);
    if (isLocked) return toAdminView(await this.products.setStatus(id, 'LOCKED'));
    if (product.status !== 'LOCKED') return toAdminView(product);
    return toAdminView(await this.products.setStatus(id, 'ON_SALE'));
  }
}

// UC39 Hết bán / còn bán: nhân viên và quản lý, chỉ giữa ON_SALE và SOLD_OUT (BR33)
@Injectable()
export class SetSaleStatusUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number, status: 'ON_SALE' | 'SOLD_OUT') {
    const product = await load(this.products, id);
    if (product.status === 'LOCKED') throw new ConflictError('Món đang bị khóa bán, chỉ quản lý mở lại được');
    return toAdminView(await this.products.setStatus(id, status));
  }
}

// UC76 Nhập số ly bán trong ngày. Nhập lại giữa ngày thì thay hẳn số còn lại (BR49).
@Injectable()
export class SetDailyStockUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number, quantity: number) {
    await load(this.products, id);
    return toAdminView(await this.products.setDailyStock(id, quantity, todayVN()));
  }
}

// UC77 Dùng lại số ly đã nhập lần gần nhất cho mọi món chưa khóa
@Injectable()
export class ReuseDailyStockUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute() {
    return { updated: await this.products.reuseDailyStock(todayVN()) };
  }
}

