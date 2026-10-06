import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export enum PayMethod {
  WALLET = 'WALLET',
  CARD = 'CARD',
}

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(PayMethod)
  method: PayMethod;
}
