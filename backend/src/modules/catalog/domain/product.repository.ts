import { Page, PageRequest } from '../../../shared/domain/page';
import { Product, ProductSpec, ProductStatus } from './product';

export abstract class ProductRepository {
  // Menu cho khách: bỏ món khóa bán và món thuộc danh mục ẩn
  abstract listOnMenu(filter: { search?: string; categoryId?: number }): Promise<Product[]>;
  abstract findById(id: number): Promise<Product | null>;
  abstract listAll(page: PageRequest): Promise<Page<Product>>;
  abstract create(spec: ProductSpec): Promise<Product>;
  abstract update(id: number, spec: ProductSpec): Promise<Product>;
  abstract setStatus(id: number, status: ProductStatus): Promise<Product>;
  abstract setDailyStock(id: number, quantity: number, today: Date): Promise<Product>;
  // Đặt lại mọi món chưa khóa về dailyQuota đã nhập lần gần nhất, trả số món đã đặt lại (UC77)
  abstract reuseDailyStock(today: Date): Promise<number>;
  // Trừ có điều kiện bằng một câu UPDATE, trả false nếu không đủ ly (BR50, BR53)
  abstract reserve(productId: number, quantity: number, today: Date): Promise<boolean>;
  // Trả ly lại nhưng không vượt dailyQuota
  abstract release(productId: number, quantity: number, today: Date): Promise<void>;
}
