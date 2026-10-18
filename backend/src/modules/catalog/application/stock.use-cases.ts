import { Injectable } from '@nestjs/common';
import { UnprocessableError } from '../../../shared/domain/domain.error';
import { sameVNDay, todayVN } from '../../../shared/domain/vn-time';
import { ProductRepository } from '../domain/product.repository';

export interface StockLine {
  productId: number;
  name: string;
  quantity: number;
}

// Gộp các dòng cùng món để trừ một lần
const merge = (lines: StockLine[]): StockLine[] => {
  const byProduct = new Map<number, StockLine>();
  for (const l of lines) {
    const cur = byProduct.get(l.productId);
    byProduct.set(l.productId, cur ? { ...cur, quantity: cur.quantity + l.quantity } : { ...l });
  }
  return [...byProduct.values()];
};

// UC18 bước 5: trừ số ly. Phải gọi trong cùng giao dịch với việc lưu đơn (BR50). Thiếu ly ở món nào thì ném lỗi 422 nêu tên món.
@Injectable()
export class ReserveStockUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(lines: StockLine[]): Promise<void> {
    const today = todayVN();
    for (const l of merge(lines)) {
      if (!(await this.products.reserve(l.productId, l.quantity, today))) {
        throw new UnprocessableError(`Món "${l.name}" không đủ số ly còn lại hôm nay`);
      }
    }
  }
}

// UC27, UC36: trả ly khi đơn bị hủy. Chỉ trả khi đơn được tạo trong hôm nay (BR50).
@Injectable()
export class ReleaseStockUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(lines: StockLine[], orderCreatedAt: Date): Promise<void> {
    if (!sameVNDay(orderCreatedAt, new Date())) return;
    const today = todayVN();
    for (const l of merge(lines)) await this.products.release(l.productId, l.quantity, today);
  }
}
