import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ProductExistence } from '../domain/product-existence';

@Injectable()
export class PrismaProductExistence implements ProductExistence {
  constructor(private readonly prisma: PrismaService) {}

  async allExist(ids: number[]) {
    if (ids.length === 0) return true;
    return (await this.prisma.db.product.count({ where: { id: { in: ids } } })) === new Set(ids).size;
  }
}
