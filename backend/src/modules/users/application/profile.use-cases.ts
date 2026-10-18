import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../../shared/domain/domain.error';
import { PasswordHasher } from '../domain/password-hasher';
import { toUserView } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

// UC04 Xem thông tin cá nhân
@Injectable()
export class GetMeUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: number) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản');
    return toUserView(user);
  }
}

export interface UpdateProfileInput {
  fullName?: string;
  // undefined: giữ nguyên, null: xóa email
  email?: string | null;
}

// UC05 Cập nhật thông tin cá nhân. Số điện thoại không đổi được (BR22).
@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: number, input: UpdateProfileInput) {
    if (input.email) {
      const owner = await this.users.findByEmail(input.email);
      if (owner && owner.id !== userId) throw new ConflictError('Email đã được sử dụng');
    }
    const updated = await this.users.update(userId, {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.email !== undefined && { email: input.email }),
    });
    return toUserView(updated);
  }
}

// UC06 Đổi mật khẩu
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản');
    if (!(await this.hasher.compare(oldPassword, user.passwordHash))) throw new UnauthorizedError('Mật khẩu cũ không đúng');
    await this.users.update(userId, { passwordHash: await this.hasher.hash(newPassword) });
    return { message: 'Đã đổi mật khẩu' };
  }
}
