import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { PageRequest } from '../../../shared/domain/page';
import { CategoryRepository } from '../domain/category.repository';

@Injectable()
export class AdminCategoriesUseCases {
  constructor(private readonly categories: CategoryRepository) {}

  // UC48 Gồm cả danh mục ẩn
  list(page: PageRequest) {
    return this.categories.listAll(page);
  }

  // UC49 Tên duy nhất
  async create(name: string) {
    if (await this.categories.findByName(name)) throw new ConflictError('Tên danh mục đã tồn tại');
    return this.categories.create(name);
  }

  // UC50
  async rename(id: number, name: string) {
    await this.mustExist(id);
    const same = await this.categories.findByName(name);
    if (same && same.id !== id) throw new ConflictError('Tên danh mục đã tồn tại');
    return this.categories.update(id, { name });
  }

  // UC51 Ẩn danh mục kéo theo món của nó ẩn khỏi menu (BR01) nhờ bộ lọc ở ProductRepository.listOnMenu
  async setVisible(id: number, isVisible: boolean) {
    await this.mustExist(id);
    return this.categories.update(id, { isVisible });
  }

  private async mustExist(id: number) {
    if (!(await this.categories.findById(id))) throw new NotFoundError('Danh mục không tồn tại');
  }
}
