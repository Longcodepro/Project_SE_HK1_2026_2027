import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { PageQuery } from '../../../../shared/presentation/page-query.dto';
import { Trim } from '../../../../shared/presentation/validators';

export class PromoCheckQuery {
  @Trim()
  @IsString()
  @MaxLength(50)
  code!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  subtotal!: number;

  // Thứ tự dòng (bắt đầu từ 0) khách chọn làm ly được tặng
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) pickedCup?: number;
  @IsOptional() @Type(() => Number) @IsInt() pickedProductId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) cupPrice?: number;
}

export class PromotionListQuery extends PageQuery {
  @IsOptional()
  @IsIn(['upcoming', 'active', 'exhausted', 'expired', 'disabled'])
  status?: 'upcoming' | 'active' | 'exhausted' | 'expired' | 'disabled';

  @IsOptional()
  @IsIn(['PUBLIC', 'PERSONAL'])
  scope?: 'PUBLIC' | 'PERSONAL';
}

export class CreatePromotionDto {
  @Trim()
  @Matches(/^[A-Za-z0-9]{4,20}$/, { message: 'Mã gồm 4 đến 20 ký tự chữ và số' })
  code!: string;

  @IsIn(['PERCENT', 'FIXED', 'FREE_DRINK']) discountType!: 'PERCENT' | 'FIXED' | 'FREE_DRINK';

  @IsOptional() @IsInt() @Min(0) discountValue?: number;
  @IsOptional() @IsInt() @Min(1) maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsInt() @Min(1) maxTotalUses?: number;
  @IsOptional() @IsInt() @Min(1) maxUsesPerUser?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) productIds?: number[];

  @Type(() => Date) @IsDate() startsAt!: Date;
  @Type(() => Date) @IsDate() endsAt!: Date;
}

export class UpdatePromotionDto extends PartialType(OmitType(CreatePromotionDto, ['code', 'productIds'] as const)) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
