import { Injectable } from '@nestjs/common';
import { UnprocessableError } from '../../../shared/domain/domain.error';
import { PasswordHasher } from '../../users/domain/password-hasher';
import { UserRepository } from '../../users/domain/user.repository';
import { OtpService } from './otp.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly otp: OtpService,
  ) {}

  async execute(phone: string, code: string, newPassword: string) {
    const user = await this.users.findByPhone(phone);
    if (!user) throw new UnprocessableError('Mã xác thực không hợp lệ hoặc đã hết hạn');
    await this.otp.verify(phone, 'RESET_PASSWORD', code);
    await this.users.update(user.id, { passwordHash: await this.hasher.hash(newPassword) });
    // BR31: các JWT đã cấp trước đó không bị thu hồi
    return { message: 'Đã đặt lại mật khẩu, vui lòng đăng nhập' };
  }
}
