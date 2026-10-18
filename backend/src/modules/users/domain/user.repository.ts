import { NewUser, User } from './user';

export abstract class UserRepository {
  abstract findById(id: number): Promise<User | null>;
  abstract findByPhone(phone: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: NewUser): Promise<User>;
  abstract update(id: number, patch: Partial<Pick<User, 'fullName' | 'email' | 'passwordHash' | 'isPhoneVerified' | 'isActive'>>): Promise<User>;
}
