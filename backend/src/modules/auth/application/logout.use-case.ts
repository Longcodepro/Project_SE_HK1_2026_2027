import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../shared/domain/auth-user';
import { RevokedTokenRepository } from '../domain/revoked-token.repository';

// BR19: thu hồi đúng thẻ đang dùng, thẻ ở thiết bị khác không bị ảnh hưởng
@Injectable()
export class LogoutUseCase {
  constructor(private readonly revoked: RevokedTokenRepository) {}

  async execute(user: AuthUser) {
    await this.revoked.revoke({ jti: user.jti, userId: user.id, expiresAt: new Date(user.exp * 1000) });
    return { message: 'Đã đăng xuất' };
  }
}
