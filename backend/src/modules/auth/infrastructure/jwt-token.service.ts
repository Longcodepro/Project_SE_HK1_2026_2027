import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Role } from '../../../shared/domain/auth-user';
import { IssuedToken, TokenService } from '../domain/token.service';

const SEVEN_DAYS_S = 7 * 24 * 3600;

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  issue(user: { id: number; role: Role }): IssuedToken {
    const jti = randomUUID();
    const token = this.jwt.sign({ sub: user.id, role: user.role }, { jwtid: jti, expiresIn: SEVEN_DAYS_S });
    return { token, jti, expiresAt: new Date(Date.now() + SEVEN_DAYS_S * 1000) };
  }
}
