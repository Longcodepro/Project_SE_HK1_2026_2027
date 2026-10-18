import { Injectable } from '@nestjs/common';
import { ConflictError } from '../../../shared/domain/domain.error';
import { PasswordHasher } from '../../users/domain/password-hasher';
import { UserRepository } from '../../users/domain/user.repository';
import { OtpService } from './otp.service';

export interface RegisterInput {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
}

// UC01: tạo tài khoản CUSTOMER chưa xác thực rồi gửi OTP. Chưa trả JWT cho tới khi nhập đúng OTP.
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly otp: OtpService,
  ) {}

  async execute(input: RegisterInput) {
    if (await this.users.findByPhone(input.phone)) throw new ConflictError('Số điện thoại đã được đăng ký');
    if (input.email && (await this.users.findByEmail(input.email))) throw new ConflictError('Email đã được sử dụng');
    await this.users.create({
      phone: input.phone,
      fullName: input.fullName,
      email: input.email ?? null,
      passwordHash: await this.hasher.hash(input.password),
      role: 'CUSTOMER',
      isPhoneVerified: false,
    });
    await this.otp.send(input.phone, 'REGISTER');
    return { phone: input.phone, message: 'Đã gửi mã xác thực qua SMS. Vui lòng nhập mã để hoàn tất đăng ký.' };
  }
}
