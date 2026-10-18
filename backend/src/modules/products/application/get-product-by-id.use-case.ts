import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/domain.error';
import { ProductRepository } from '../domain/product.repository';

@Injectable()
export class GetProductByIdUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Sản phẩm không tồn tại');
    return product;
  }
}
