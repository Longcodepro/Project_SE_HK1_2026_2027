import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { ToppingRepository } from '../domain/topping.repository';

@Injectable()
export class AdminToppingsUseCases {
  constructor(private readonly toppings: ToppingRepository) {}

  // UC52
  list(page: PageRequest) {
    return this.toppings.listAll(page);
  }

  // UC53
  async create(data: { name: string; price: number }) {
    if (await this.toppings.findByName(data.name)) throw new ConflictError('Tên topping đã tồn tại');
    return this.toppings.create(data);
  }

  // UC54 Đơn cũ không đổi vì đã lưu ảnh chụp giá (BR26)
  async update(id: number, patch: { name?: string; price?: number }) {
    await this.mustExist(id);
    if (patch.name) {
      const same = await this.toppings.findByName(patch.name);
      if (same && same.id !== id) throw new ConflictError('Tên topping đã tồn tại');
    }
    return this.toppings.update(id, patch);
  }

  // UC55 Khóa / mở bán topping
  async setAvailable(id: number, isAvailable: boolean) {
    await this.mustExist(id);
    return this.toppings.update(id, { isAvailable });
  }

  private async mustExist(id: number) {
    if (!(await this.toppings.findById(id))) throw new NotFoundError('Topping không tồn tại');
  }
}
