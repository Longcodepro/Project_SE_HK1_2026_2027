import { Injectable } from '@nestjs/common';
import { ConflictError, UnprocessableError } from '../../../shared/domain/domain.error';
import { UserRepository } from '../../users/domain/user.repository';
import { TokenService } from '../domain/token.service';
import { AuthResult, buildAuthResult } from './auth-result';
import { OtpService } from './otp.service';

@Injectable()
export class VerifyRegisterOtpUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  async execute(phone: string, code: string): Promise<AuthResult> {
    const user = await this.users.findByPhone(phone);
    if (!user) throw new UnprocessableError('Mã xác thực không hợp lệ hoặc đã hết hạn');
    if (user.isPhoneVerified) throw new ConflictError('Số điện thoại đã được xác thực, hãy đăng nhập');
    await this.otp.verify(phone, 'REGISTER', code);
    const verified = await this.users.update(user.id, { isPhoneVerified: true });
    return buildAuthResult(this.tokens, verified);
  }
}
