import { Injectable } from '@nestjs/common';
import { Role } from '../../../shared/domain/auth-user';
import { ConflictError, NotFoundError, UnprocessableError } from '../../../shared/domain/domain.error';
import { Page, PageRequest } from '../../../shared/domain/page';
import { PasswordHasher } from '../domain/password-hasher';
import { toUserView, UserView } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

// UC60 Danh sách tài khoản. Mặc định chỉ hiện khách hàng (UC60).
@Injectable()
export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(filter: { search?: string; role?: Role; isActive?: boolean }, page: PageRequest): Promise<Page<UserView>> {
    const result = await this.users.list({ ...filter, role: filter.role ?? 'CUSTOMER' }, page);
    return { ...result, items: result.items.map(toUserView) };
  }
}

// UC61 Chi tiết tài khoản kèm số đơn và tổng tiền đã chi
@Injectable()
export class GetUserDetailUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: number) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản');
    return { ...toUserView(user), ...(await this.users.orderStats(id)) };
  }
}

// UC62 Khóa / mở khóa. Hiệu lực với JWT cũ ngay lần gọi kế tiếp nhờ ValidateTokenUseCase (BR17).
@Injectable()
export class SetUserActiveUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(actorId: number, id: number, isActive: boolean) {
    if (actorId === id) throw new UnprocessableError('Không thể tự khóa tài khoản của chính mình');
    if (!(await this.users.findById(id))) throw new NotFoundError('Không tìm thấy tài khoản');
    return toUserView(await this.users.update(id, { isActive }));
  }
}

// UC75 Quản lý tạo tài khoản nhân viên: không cần OTP (BR46)
@Injectable()
export class CreateStaffUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { phone: string; fullName: string; password: string; email?: string }) {
    if (await this.users.findByPhone(input.phone)) throw new ConflictError('Số điện thoại đã được sử dụng');
    if (input.email && (await this.users.findByEmail(input.email))) throw new ConflictError('Email đã được sử dụng');
    const created = await this.users.create({
      phone: input.phone,
      fullName: input.fullName,
      email: input.email ?? null,
      passwordHash: await this.hasher.hash(input.password),
      role: 'STAFF',
      isPhoneVerified: true,
    });
    return toUserView(created);
  }
}
