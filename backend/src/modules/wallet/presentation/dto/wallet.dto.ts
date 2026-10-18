import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageQuery } from '../../../../shared/presentation/page-query.dto';
import { Trim } from '../../../../shared/presentation/validators';

export class RequestWithdrawalDto {
  @IsInt() amount!: number;

  @IsIn(['EWALLET', 'CARD', 'BANK']) destinationType!: 'EWALLET' | 'CARD' | 'BANK';

  @Trim() @IsString() @IsNotEmpty() @MaxLength(100) accountName!: string;
  @Trim() @IsString() @IsNotEmpty() @MaxLength(30) accountNumber!: string;

  @IsOptional() @Trim() @IsString() @MaxLength(100) bankName?: string;
}

export class WithdrawalQuery extends PageQuery {
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'REJECTED'])
  status?: 'PENDING' | 'COMPLETED' | 'REJECTED';
}

export class CompleteWithdrawalDto {
  @Trim() @IsString() @IsNotEmpty() @MaxLength(50) transferRef!: string;
}

export class RejectWithdrawalDto {
  @Trim()
  @IsString()
  @MinLength(5, { message: 'Lý do từ chối tối thiểu 5 ký tự' })
  @MaxLength(200)
  rejectReason!: string;
}
