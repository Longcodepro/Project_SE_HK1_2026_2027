import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Page, PageRequest, toPage } from '../../../shared/domain/page';
import { NewUser, User } from '../domain/user';
import { UserFilter, UserOrderStats, UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { phone } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { email } });
  }

  create(data: NewUser): Promise<User> {
    return this.prisma.db.user.create({ data });
  }

  update(id: number, patch: Parameters<UserRepository['update']>[1]): Promise<User> {
    return this.prisma.db.user.update({ where: { id }, data: patch });
  }

  async list(filter: UserFilter, page: PageRequest): Promise<Page<User>> {
    const where = {
      role: filter.role,
      ...(filter.isActive !== undefined && { isActive: filter.isActive }),
      ...(filter.search && { OR: [{ phone: { contains: filter.search } }, { fullName: { contains: filter.search, mode: 'insensitive' as const } }] }),
    };
    const [items, total] = await Promise.all([
      this.prisma.db.user.findMany({ where, orderBy: { id: 'desc' }, skip: (page.page - 1) * page.pageSize, take: page.pageSize }),
      this.prisma.db.user.count({ where }),
    ]);
    return toPage(items, total, page);
  }

  async orderStats(userId: number): Promise<UserOrderStats> {
    const agg = await this.prisma.db.order.aggregate({
      where: { userId, status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] } },
      _count: true,
      _sum: { totalAmount: true },
    });
    return { orderCount: agg._count, totalSpent: agg._sum.totalAmount ?? 0 };
  }
}
