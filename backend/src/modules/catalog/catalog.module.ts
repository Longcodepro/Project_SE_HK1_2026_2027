import { Module } from '@nestjs/common';
import { AdminCategoriesUseCases } from './application/admin-categories.use-cases';
import {
  CreateProductUseCase,
  ListAdminProductsUseCase,
  ReuseDailyStockUseCase,
  SetDailyStockUseCase,
  SetProductLockedUseCase,
  SetSaleStatusUseCase,
  UpdateProductUseCase,
} from './application/admin-products.use-cases';
import { AdminToppingsUseCases } from './application/admin-toppings.use-cases';
import { GetMenuProductUseCase, ListCategoriesUseCase, ListMenuProductsUseCase } from './application/menu.use-cases';
import { ReleaseStockUseCase, ReserveStockUseCase } from './application/stock.use-cases';
import { CategoryRepository } from './domain/category.repository';
import { ProductRepository } from './domain/product.repository';
import { ToppingRepository } from './domain/topping.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { PrismaToppingRepository } from './infrastructure/prisma-topping.repository';
import { AdminCategoriesController } from './presentation/admin-categories.controller';
import { AdminProductsController } from './presentation/admin-products.controller';
import { AdminToppingsController } from './presentation/admin-toppings.controller';
import { MenuController } from './presentation/menu.controller';

@Module({
  controllers: [MenuController, AdminProductsController, AdminCategoriesController, AdminToppingsController],
  providers: [
    ListCategoriesUseCase,
    ListMenuProductsUseCase,
    GetMenuProductUseCase,
    ListAdminProductsUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    SetProductLockedUseCase,
    SetSaleStatusUseCase,
    SetDailyStockUseCase,
    ReuseDailyStockUseCase,
    AdminCategoriesUseCases,
    AdminToppingsUseCases,
    ReserveStockUseCase,
    ReleaseStockUseCase,
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    { provide: ToppingRepository, useClass: PrismaToppingRepository },
  ],
  // Module đơn hàng dùng để trừ và trả số ly, và để đọc thông tin món khi tính giá
  exports: [ReserveStockUseCase, ReleaseStockUseCase, ProductRepository, ToppingRepository],
})
export class CatalogModule {}
