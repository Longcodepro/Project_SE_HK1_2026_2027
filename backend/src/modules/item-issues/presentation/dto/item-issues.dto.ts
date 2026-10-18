import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageQuery } from '../../../../shared/presentation/page-query.dto';
import { Trim } from '../../../../shared/presentation/validators';

export class HandleMissingItemDto {
  @IsInt() orderItemId!: number;
  @IsInt() quantity!: number;

  @IsIn(['REFUND_TO_WALLET', 'EXCHANGE']) resolution!: 'REFUND_TO_WALLET' | 'EXCHANGE';

  @Trim()
  @IsString()
  @MinLength(5, { message: 'Lý do từ 5 đến 200 ký tự' })
  @MaxLength(200, { message: 'Lý do từ 5 đến 200 ký tự' })
  note!: string;
}

export class ItemIssueQuery extends PageQuery {
  @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @IsOptional() @Type(() => Date) @IsDate() to?: Date;
  @IsOptional() @IsIn(['REFUND_TO_WALLET', 'EXCHANGE']) resolution?: 'REFUND_TO_WALLET' | 'EXCHANGE';
}
