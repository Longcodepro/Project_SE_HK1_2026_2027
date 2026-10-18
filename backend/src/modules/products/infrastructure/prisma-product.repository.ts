import { Injectable } from '@nestjs/common';
import { Product as ProductRow } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Product } from '../domain/product.entity';
import { ProductRepository } from '../domain/product.repository';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (await this.prisma.product.findMany()).map(toEntity);
  }

  async findById(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }
}

const toEntity = (r: ProductRow) => new Product(r.id, r.name, r.price, r.imageUrl, r.stock);
