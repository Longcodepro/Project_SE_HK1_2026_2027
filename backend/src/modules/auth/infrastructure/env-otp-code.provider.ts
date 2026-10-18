import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { OtpCodeProvider } from '../domain/otp-code.provider';

@Injectable()
export class EnvOtpCodeProvider implements OtpCodeProvider {
  generate(): string {
    // Mặc định dùng mã cố định 123456 để demo và test (BR27); đặt OTP_RANDOM=true để sinh ngẫu nhiên khi chạy thật.
    // Mã vẫn chỉ "gửi" qua SMS giả lập (ghi log), nên ngẫu nhiên mà không có SMS thật thì không ai đọc được mã.
    if (process.env.OTP_RANDOM !== 'true') return process.env.OTP_FIXED_CODE ?? '123456';
    return String(randomInt(100000, 1000000));
  }
}
