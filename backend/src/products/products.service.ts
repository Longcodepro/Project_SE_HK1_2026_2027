import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new HttpException(
        { statusCode: 404, message: 'Sản phẩm không tồn tại' },
        HttpStatus.NOT_FOUND,
      );
    }
    return product;
  }
}
