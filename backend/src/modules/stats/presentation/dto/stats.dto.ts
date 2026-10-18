import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class StatsQuery {
  @IsOptional() @Type(() => Date) @IsDate({ message: 'from phải là ngày hợp lệ' }) from?: Date;
  @IsOptional() @Type(() => Date) @IsDate({ message: 'to phải là ngày hợp lệ' }) to?: Date;

  @IsOptional() @IsIn(['day', 'month']) groupBy?: 'day' | 'month';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
