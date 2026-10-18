import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/product.repository';

@Injectable()
export class GetProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute() {
    return this.products.findAll();
  }
}
