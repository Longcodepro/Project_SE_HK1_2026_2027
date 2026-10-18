import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../shared/domain/auth-user';
import { ForbiddenError, UnauthorizedError } from '../../../shared/domain/domain.error';
import { UserRepository } from '../../users/domain/user.repository';
import { RevokedTokenRepository } from '../domain/revoked-token.repository';

export interface TokenPayload {
  sub: number;
  jti: string;
  exp: number;
}

// Chạy ở mỗi request có JWT: thẻ bị thu hồi 401, tài khoản bị khóa 403 (BR17, BR19). Vai trò lấy mới từ DB.
@Injectable()
export class ValidateTokenUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly revoked: RevokedTokenRepository,
  ) {}

  async execute(payload: TokenPayload): Promise<AuthUser> {
    if (await this.revoked.isRevoked(payload.jti)) throw new UnauthorizedError('Phiên đăng nhập đã hết hiệu lực');
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedError('Tài khoản không tồn tại');
    if (!user.isActive) throw new ForbiddenError('Tài khoản đã bị khóa');
    return { id: user.id, role: user.role, jti: payload.jti, exp: payload.exp };
  }
}
