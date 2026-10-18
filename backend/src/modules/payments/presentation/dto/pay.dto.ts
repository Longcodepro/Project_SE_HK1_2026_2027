import { Transform, Type } from 'class-transformer';
import { IsDefined, IsIn, IsInt, IsOptional, Matches, ValidateIf, ValidateNested } from 'class-validator';
import { Trim } from '../../../../shared/presentation/validators';

// Số thẻ nhập có dấu cách (4111 1111 ...) thì bỏ dấu cách trước khi kiểm
const stripSpaces = () => Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value));

export class CardDto {
  @stripSpaces() @Matches(/^\d{16}$/, { message: 'Số thẻ gồm đúng 16 chữ số' }) number!: string;

  // Chữ không dấu, tối đa 50 ký tự
  @IsOptional() @Trim() @Matches(/^[A-Za-z ]{1,50}$/, { message: 'Tên chủ thẻ viết không dấu, tối đa 50 ký tự' }) holderName?: string;

  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Hạn thẻ dạng MM/YY' })
  expiry!: string;

  @Matches(/^\d{3}$/, { message: 'CVV gồm đúng 3 chữ số' }) cvv!: string;
}

export class PayDto {
  @IsInt() orderId!: number;

  @IsIn(['EWALLET', 'CARD', 'TRANSFER']) method!: 'EWALLET' | 'CARD' | 'TRANSFER';

  // Bắt buộc khi trả bằng thẻ; không lưu và không ghi log (BR41)
  @ValidateIf((o) => o.method === 'CARD')
  @IsDefined({ message: 'Thanh toán bằng thẻ cần có thông tin thẻ' })
  @ValidateNested()
  @Type(() => CardDto)
  card?: CardDto;
}

