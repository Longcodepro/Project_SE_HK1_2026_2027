import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetMenuProductUseCase, ListCategoriesUseCase, ListMenuProductsUseCase } from '../application/menu.use-cases';
import { ProductQuery } from './dto/catalog.dto';

// Khách vãng lai xem được menu, không cần đăng nhập (BR29)
@ApiTags('menu')
@Controller()
export class MenuController {
  constructor(
    private readonly categories: ListCategoriesUseCase,
    private readonly products: ListMenuProductsUseCase,
    private readonly product: GetMenuProductUseCase,
  ) {}

  @Get('categories')
  listCategories() {
    return this.categories.execute();
  }

  @Get('products')
  listProducts(@Query() q: ProductQuery) {
    return this.products.execute(q);
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.product.execute(id);
  }
}
