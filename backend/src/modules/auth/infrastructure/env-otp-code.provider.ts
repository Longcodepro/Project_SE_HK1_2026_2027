import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { OtpCodeProvider } from '../domain/otp-code.provider';

@Injectable()
export class EnvOtpCodeProvider implements OtpCodeProvider {
  generate(): string {
    // Mã cố định 123456 khi chưa chạy production (BR27); OTP_FIXED_CODE đổi được mã này
    if (process.env.NODE_ENV !== 'production') return process.env.OTP_FIXED_CODE ?? '123456';
    return String(randomInt(100000, 1000000));
  }
}
