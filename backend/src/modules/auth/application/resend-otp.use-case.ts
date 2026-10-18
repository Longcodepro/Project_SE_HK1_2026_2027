import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain.error';
import { UserRepository } from '../../users/domain/user.repository';
import { OtpService } from './otp.service';

// Gửi lại OTP đăng ký cho tài khoản chưa xác thực (UC01, UC02)
@Injectable()
export class ResendOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly otp: OtpService,
  ) {}

  async execute(phone: string) {
    const user = await this.users.findByPhone(phone);
    if (!user) throw new NotFoundError('Số điện thoại chưa đăng ký');
    if (user.isPhoneVerified) throw new ConflictError('Số điện thoại đã được xác thực, hãy đăng nhập');
    await this.otp.send(phone, 'REGISTER');
    return { message: 'Đã gửi lại mã xác thực' };
  }
}
