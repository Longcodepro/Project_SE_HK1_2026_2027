import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../users/domain/user.repository';
import { OtpService } from './otp.service';

// UC68: luôn trả lời giống nhau dù số có tài khoản hay không, để không dò ra số nào đã đăng ký (BR31)
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly otp: OtpService,
  ) {}

  async execute(phone: string) {
    const user = await this.users.findByPhone(phone);
    if (user && user.isPhoneVerified && user.isActive) await this.otp.send(phone, 'RESET_PASSWORD');
    return { message: 'Nếu số này đã đăng ký thì mã xác thực đã được gửi.' };
  }
}
