import { Role } from '../../../shared/domain/auth-user';

export interface User {
  id: number;
  phone: string;
  isPhoneVerified: boolean;
  email: string | null;
  passwordHash: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  loyaltyPoints: number;
  walletBalance: number;
  totalCups: number;
  createdAt: Date;
}

// Dạng trả ra ngoài API: tuyệt đối không có passwordHash
export type UserView = Omit<User, 'passwordHash'>;

export const toUserView = ({ passwordHash: _omit, ...rest }: User): UserView => rest;

export interface NewUser {
  phone: string;
  fullName: string;
  passwordHash: string;
  email?: string | null;
  role?: Role;
  isPhoneVerified?: boolean;
}
