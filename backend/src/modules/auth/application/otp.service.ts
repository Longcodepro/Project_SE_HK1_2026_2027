import { Injectable } from '@nestjs/common';
import { UnprocessableError } from '../../../shared/domain/domain.error';
import { SmsGateway } from '../../notifications/domain/gateways';
import { hashOtp, isOtpUsable, OTP_MAX_ATTEMPTS, OTP_TTL_MS, otpResendSeconds, OtpPurpose } from '../domain/otp';
import { OtpCodeProvider } from '../domain/otp-code.provider';
import { OtpRepository } from '../domain/otp.repository';

// Gửi và kiểm OTP, dùng chung cho đăng ký (UC01) và quên mật khẩu (UC68)
@Injectable()
export class OtpService {
  constructor(
    private readonly otps: OtpRepository,
    private readonly codes: OtpCodeProvider,
    private readonly sms: SmsGateway,
  ) {}

  async send(phone: string, purpose: OtpPurpose): Promise<void> {
    const now = new Date();
    const last = await this.otps.findLatest(phone, purpose);
    if (last) {
      const wait = otpResendSeconds() - Math.floor((now.getTime() - last.createdAt.getTime()) / 1000);
      if (wait > 0) throw new UnprocessableError(`Vui lòng đợi ${wait} giây nữa để nhận mã mới`);
    }
    const code = this.codes.generate();
    await this.otps.create({ phone, purpose, codeHash: hashOtp(phone, code), expiresAt: new Date(now.getTime() + OTP_TTL_MS) });
    await this.sms.send(phone, `BrewLite: mã xác thực của bạn là ${code}, có hiệu lực 5 phút.`);
  }

  // Đúng thì đánh dấu đã dùng. Sai thì tăng số lần sai (không nằm trong giao dịch nên không bị hoàn tác khi ném lỗi).
  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
    const now = new Date();
    const record = await this.otps.findLatest(phone, purpose);
    if (!isOtpUsable(record, now)) throw new UnprocessableError('Mã xác thực không hợp lệ hoặc đã hết hạn');
    if (record.codeHash !== hashOtp(phone, code)) {
      await this.otps.increaseAttempts(record.id);
      const left = OTP_MAX_ATTEMPTS - record.attempts - 1;
      throw new UnprocessableError(left > 0 ? `Mã xác thực không đúng, còn ${left} lần thử` : 'Mã xác thực đã bị khóa do nhập sai quá nhiều lần');
    }
    await this.otps.consume(record.id, now);
  }
}
