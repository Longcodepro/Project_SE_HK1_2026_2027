import { Product } from './product.entity';

// abstract class thay vì interface để dùng làm token cho DI của NestJS
export abstract class ProductRepository {
  abstract findAll(): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | null>;
}
