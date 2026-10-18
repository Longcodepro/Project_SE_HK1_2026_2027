import { Injectable } from '@nestjs/common';
import { ForbiddenError, UnauthorizedError } from '../../../shared/domain/domain.error';
import { PasswordHasher } from '../../users/domain/password-hasher';
import { UserRepository } from '../../users/domain/user.repository';
import { TokenService } from '../domain/token.service';
import { AuthResult, buildAuthResult } from './auth-result';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(phone: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByPhone(phone);
    // Cùng một thông báo cho "không có số" và "sai mật khẩu" để không lộ số nào đã đăng ký
    if (!user || !(await this.hasher.compare(password, user.passwordHash))) throw new UnauthorizedError('Số điện thoại hoặc mật khẩu không đúng');
    if (!user.isActive) throw new ForbiddenError('Tài khoản đã bị khóa'); // BR17
    if (!user.isPhoneVerified) throw new ForbiddenError('Số điện thoại chưa được xác thực, vui lòng nhập mã OTP'); // BR27
    return buildAuthResult(this.tokens, user);
  }
}
