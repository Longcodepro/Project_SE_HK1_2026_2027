export type Role = 'CUSTOMER' | 'STAFF' | 'MANAGER';

// Người đang gọi API, do JwtStrategy dựng từ token và dữ liệu mới nhất trong DB
export interface AuthUser {
  id: number;
  role: Role;
  jti: string;
  exp: number; // giây kể từ epoch, lấy từ token
}

export const STAFF_UP: Role[] = ['STAFF', 'MANAGER'];
export const MANAGER_ONLY: Role[] = ['MANAGER'];
export const CUSTOMER_ONLY: Role[] = ['CUSTOMER'];
