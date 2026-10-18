import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetProductByIdUseCase } from '../application/get-product-by-id.use-case';
import { GetProductsUseCase } from '../application/get-products.use-case';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProducts: GetProductsUseCase,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  @Get()
  findAll() {
    return this.getProducts.execute();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getProductById.execute(id);
  }
}
