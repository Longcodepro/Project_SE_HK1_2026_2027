import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum OrderSize {
  S = 'S',
  M = 'M',
  L = 'L',
}

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsEnum(OrderSize)
  size: OrderSize;

  @IsInt()
  @Min(1)
  qty: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Giỏ hàng không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
