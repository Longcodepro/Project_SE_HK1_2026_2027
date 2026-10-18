import { Module } from '@nestjs/common';
import { GetProductByIdUseCase } from './application/get-product-by-id.use-case';
import { GetProductsUseCase } from './application/get-products.use-case';
import { ProductRepository } from './domain/product.repository';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { ProductsController } from './presentation/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    GetProductsUseCase,
    GetProductByIdUseCase,
    { provide: ProductRepository, useClass: PrismaProductRepository },
  ],
})
export class ProductsModule {}
