import { Page, PageRequest } from '../../../shared/domain/page';
import { Role } from '../../../shared/domain/auth-user';
import { NewUser, User } from './user';

export interface UserFilter {
  search?: string; // tìm theo số điện thoại hoặc họ tên
  role: Role;
  isActive?: boolean;
}

export interface UserOrderStats {
  orderCount: number;
  totalSpent: number;
}

export abstract class UserRepository {
  abstract findById(id: number): Promise<User | null>;
  abstract findByPhone(phone: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: NewUser): Promise<User>;
  abstract update(id: number, patch: Partial<Pick<User, 'fullName' | 'email' | 'passwordHash' | 'isPhoneVerified' | 'isActive'>>): Promise<User>;
  abstract list(filter: UserFilter, page: PageRequest): Promise<Page<User>>;
  // Số đơn và tổng tiền đã chi, chỉ tính đơn đã trả tiền (BR21)
  abstract orderStats(userId: number): Promise<UserOrderStats>;
}
