import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload, ValidateTokenUseCase } from '../application/validate-token.use-case';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly validateToken: ValidateTokenUseCase) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // BR30: quá 7 ngày thì 401
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  validate(payload: TokenPayload) {
    return this.validateToken.execute(payload);
  }
}
