import { Role } from '../../../shared/domain/auth-user';

export interface IssuedToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

export abstract class TokenService {
  // JWT sống 7 ngày, mỗi thẻ có một jti riêng để thu hồi được (BR19, BR30)
  abstract issue(user: { id: number; role: Role }): IssuedToken;
}
