import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { PageQuery } from '../../../../shared/presentation/page-query.dto';
import { Trim } from '../../../../shared/presentation/validators';
import { ORDER_STATUSES } from '../../domain/order';

export class OrderToppingDto {
  @IsInt() toppingId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class OrderLineDto {
  @IsInt() productId!: number;

  @IsIn(['S', 'M', 'L']) sizeCode!: 'S' | 'M' | 'L';

  @IsInt() iceLevel!: number;
  @IsInt() sugarLevel!: number;

  @IsIn(['HOT', 'COLD']) temperature!: 'HOT' | 'COLD';

  // BR36: tối đa 20 từ và 200 ký tự (kiểm số từ ở domain)
  @IsOptional() @Trim() @IsString() @MaxLength(200) note?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderToppingDto)
  toppings?: OrderToppingDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn phải có ít nhất một món' })
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsOptional() @Trim() @IsString() @MaxLength(50) promotionCode?: string;

  @IsOptional() @IsInt() @Min(0) freeCupLine?: number;
}

export class OrderListQuery extends PageQuery {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}

export class UpdateStatusDto {
  @IsIn(ORDER_STATUSES) status!: (typeof ORDER_STATUSES)[number];
}

export class CompleteOrderDto {
  @Matches(/^\d{6}$/, { message: 'Mã nhận hàng gồm đúng 6 chữ số' }) pickupCode!: string;
}

export class CustomerCancelDto {
  @IsOptional() @Trim() @IsString() @MaxLength(200) note?: string;
}

export class StaffCancelDto {
  @Trim()
  @IsString()
  @MinLength(5, { message: 'Lý do hủy từ 5 đến 200 ký tự' })
  @MaxLength(200, { message: 'Lý do hủy từ 5 đến 200 ký tự' })
  @IsNotEmpty()
  note!: string;
}

export class SubmitFeedbackDto {
  @IsInt() @Min(1) @Max(5) rating!: number;

  @IsOptional() @Trim() @IsString() @MaxLength(300) comment?: string;
}

export class FeedbackQuery extends PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
}
