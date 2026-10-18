import { Module } from '@nestjs/common';
import { CreatePromotionUseCase, DeactivatePromotionUseCase, ListPromotionsUseCase, UpdatePromotionUseCase } from './application/admin-promotions.use-cases';
import { ListMyVouchersUseCase, ValidatePromotionUseCase } from './application/customer-promotions.use-cases';
import { RecordPromotionUsageUseCase, ReleasePromotionUsageUseCase, ResolvePromotionForOrderUseCase } from './application/order-promotions.use-cases';
import { ProductExistence } from './domain/product-existence';
import { PromotionRepository } from './domain/promotion.repository';
import { PrismaProductExistence } from './infrastructure/prisma-product-existence';
import { PrismaPromotionRepository } from './infrastructure/prisma-promotion.repository';
import { AdminPromotionsController } from './presentation/admin-promotions.controller';
import { PromotionsController } from './presentation/promotions.controller';

@Module({
  controllers: [PromotionsController, AdminPromotionsController],
  providers: [
    ValidatePromotionUseCase,
    ListMyVouchersUseCase,
    ListPromotionsUseCase,
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeactivatePromotionUseCase,
    ResolvePromotionForOrderUseCase,
    RecordPromotionUsageUseCase,
    ReleasePromotionUsageUseCase,
    { provide: PromotionRepository, useClass: PrismaPromotionRepository },
    { provide: ProductExistence, useClass: PrismaProductExistence },
  ],
  // Module đơn hàng và tích điểm dùng các use case và repository này
  exports: [ResolvePromotionForOrderUseCase, RecordPromotionUsageUseCase, ReleasePromotionUsageUseCase, PromotionRepository, ProductExistence],
})
export class PromotionsModule {}
