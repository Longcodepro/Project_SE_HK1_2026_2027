import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ForgotPasswordUseCase } from './application/forgot-password.use-case';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { OtpService } from './application/otp.service';
import { RegisterUseCase } from './application/register.use-case';
import { ResendOtpUseCase } from './application/resend-otp.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { ValidateTokenUseCase } from './application/validate-token.use-case';
import { VerifyRegisterOtpUseCase } from './application/verify-register-otp.use-case';
import { OtpCodeProvider } from './domain/otp-code.provider';
import { OtpRepository } from './domain/otp.repository';
import { RevokedTokenRepository } from './domain/revoked-token.repository';
import { TokenService } from './domain/token.service';
import { EnvOtpCodeProvider } from './infrastructure/env-otp-code.provider';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaOtpRepository } from './infrastructure/prisma-otp.repository';
import { PrismaRevokedTokenRepository } from './infrastructure/prisma-revoked-token.repository';
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy } from './presentation/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    PassportModule,
    // Đọc secret lúc khởi động (sau khi main.ts đã nạp .env), không đọc lúc import file
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET }) }),
  ],
  controllers: [AuthController],
  providers: [
    OtpService,
    RegisterUseCase,
    VerifyRegisterOtpUseCase,
    ResendOtpUseCase,
    LoginUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LogoutUseCase,
    ValidateTokenUseCase,
    JwtStrategy,
    { provide: OtpRepository, useClass: PrismaOtpRepository },
    { provide: RevokedTokenRepository, useClass: PrismaRevokedTokenRepository },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: OtpCodeProvider, useClass: EnvOtpCodeProvider },
  ],
})
export class AuthModule {}
