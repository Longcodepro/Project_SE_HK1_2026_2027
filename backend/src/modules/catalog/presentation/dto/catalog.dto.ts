import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Trim } from '../../../../shared/presentation/validators';

export class ProductQuery {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}

export class ProductSizeInput {
  @IsIn(['S', 'M', 'L']) sizeCode!: 'S' | 'M' | 'L';

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  volumeMl?: number | null;
}

// Mức đá / đường: số nguyên 0-100, tùy chọn (BR04)
const Level = () => applyDecorators(IsOptional(), IsInt(), Min(0), Max(100));

export class CreateProductDto {
  @IsInt() categoryId!: number;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Món phải có ít nhất một size' })
  @ValidateNested({ each: true })
  @Type(() => ProductSizeInput)
  sizes!: ProductSizeInput[];

  @IsOptional() @IsArray() @IsInt({ each: true }) toppingIds?: number[];

  @IsOptional() @IsInt() @Min(0) @Max(10) maxPerTopping?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) maxToppingTotal?: number;

  @IsOptional() @IsBoolean() allowHot?: boolean;
  @IsOptional() @IsBoolean() allowCold?: boolean;
  @IsOptional() @IsIn(['HOT', 'COLD']) defaultTemperature?: 'HOT' | 'COLD';

  @Level() iceMin?: number;
  @Level() iceMax?: number;
  @Level() iceDefault?: number;
  @Level() sugarMin?: number;
  @Level() sugarMax?: number;
  @Level() sugarDefault?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class SetLockedDto {
  @IsBoolean() isLocked!: boolean;
}

export class SetSaleStatusDto {
  @IsIn(['ON_SALE', 'SOLD_OUT'], { message: 'Trạng thái chỉ được là ON_SALE hoặc SOLD_OUT' })
  status!: 'ON_SALE' | 'SOLD_OUT';
}

export class SetDailyStockDto {
  @IsInt()
  @Min(0)
  @Max(9999)
  quantity!: number;
}

export class CategoryNameDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100)
  name!: string;
}

export class SetVisibilityDto {
  @IsBoolean() isVisible!: boolean;
}

export class CreateToppingDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Tên topping không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(0)
  price!: number;
}

export class UpdateToppingDto extends PartialType(CreateToppingDto) {}

export class SetAvailabilityDto {
  @IsBoolean() isAvailable!: boolean;
}
