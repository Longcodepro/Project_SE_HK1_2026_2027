import { Injectable } from '@nestjs/common';
import { BadRequestError, NotFoundError } from '../../../shared/domain/domain.error';
import { isOnMenu } from '../domain/product';
import { CategoryRepository } from '../domain/category.repository';
import { ProductRepository } from '../domain/product.repository';
import { toMenuView } from './product-view';

// UC07, UC09 Danh mục đang hiện
@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute() {
    return this.categories.listVisible();
  }
}

// UC07 menu, UC08 tìm theo tên, UC09 lọc theo danh mục
@Injectable()
export class ListMenuProductsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(filter: { search?: string; categoryId?: number }) {
    if (filter.categoryId !== undefined) {
      const category = await this.categories.findById(filter.categoryId);
      if (!category || !category.isVisible) throw new BadRequestError('Danh mục không tồn tại hoặc đang ẩn');
    }
    const now = new Date();
    return (await this.products.listOnMenu(filter)).map((p) => toMenuView(p, now));
  }
}

// UC10 Chi tiết món. Món khóa bán hoặc thuộc danh mục ẩn trả 404 (BR01, BR02).
@Injectable()
export class GetMenuProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number) {
    const product = await this.products.findById(id);
    if (!product || !isOnMenu(product)) throw new NotFoundError('Sản phẩm không tồn tại');
    return toMenuView(product);
  }
}
