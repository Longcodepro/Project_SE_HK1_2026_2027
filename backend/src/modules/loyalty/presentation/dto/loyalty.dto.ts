import { OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../../../shared/presentation/validators';

export class UpdateLoyaltySettingsDto {
  @IsOptional() @IsInt() @Min(1000, { message: 'Bước tiền tối thiểu 1.000đ' }) amountStep?: number;
  @IsOptional() @IsInt() @Min(1) pointsPerStep?: number;
}

export class CreateRewardRuleDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(['POINTS', 'CUPS']) kind!: 'POINTS' | 'CUPS';

  @IsInt() @Min(1) threshold!: number;

  @IsIn(['PERCENT', 'FIXED', 'FREE_DRINK']) discountType!: 'PERCENT' | 'FIXED' | 'FREE_DRINK';

  @IsOptional() @IsInt() @Min(0) discountValue?: number;
  @IsOptional() @IsInt() @Min(1) maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(0) minOrderAmount?: number;

  @IsInt() @Min(1) @Max(365) validDays!: number;

  @IsOptional() @IsArray() @IsInt({ each: true }) productIds?: number[];
}

export class UpdateRewardRuleDto extends PartialType(OmitType(CreateRewardRuleDto, ['kind', 'productIds'] as const)) {}

export class SetRuleActiveDto {
  @IsBoolean() isActive!: boolean;
}
