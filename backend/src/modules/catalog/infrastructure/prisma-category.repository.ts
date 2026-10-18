import { Injectable } from '@nestjs/common';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Category } from '../domain/category';
import { CategoryRepository } from '../domain/category.repository';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listVisible(): Promise<Category[]> {
    return this.prisma.db.category.findMany({ where: { isVisible: true }, orderBy: { id: 'asc' } });
  }

  async listAll(page: PageRequest): Promise<Page<Category>> {
    const [items, total] = await Promise.all([
      this.prisma.db.category.findMany({ orderBy: { id: 'asc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.category.count(),
    ]);
    return toPage(items, total, page);
  }

  findById(id: number): Promise<Category | null> {
    return this.prisma.db.category.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Category | null> {
    return this.prisma.db.category.findUnique({ where: { name } });
  }

  create(name: string): Promise<Category> {
    return this.prisma.db.category.create({ data: { name } });
  }

  update(id: number, patch: Partial<Pick<Category, 'name' | 'isVisible'>>): Promise<Category> {
    return this.prisma.db.category.update({ where: { id }, data: patch });
  }
}
