import { Injectable } from '@nestjs/common';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Topping } from '../domain/topping';
import { ToppingRepository } from '../domain/topping.repository';

@Injectable()
export class PrismaToppingRepository implements ToppingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(page: PageRequest): Promise<Page<Topping>> {
    const [items, total] = await Promise.all([
      this.prisma.db.topping.findMany({ orderBy: { id: 'asc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.topping.count(),
    ]);
    return toPage(items, total, page);
  }

  findById(id: number): Promise<Topping | null> {
    return this.prisma.db.topping.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Topping | null> {
    return this.prisma.db.topping.findUnique({ where: { name } });
  }

  findByIds(ids: number[]): Promise<Topping[]> {
    return this.prisma.db.topping.findMany({ where: { id: { in: ids } } });
  }

  create(data: { name: string; price: number }): Promise<Topping> {
    return this.prisma.db.topping.create({ data });
  }

  update(id: number, patch: Partial<Omit<Topping, 'id'>>): Promise<Topping> {
    return this.prisma.db.topping.update({ where: { id }, data: patch });
  }
}
