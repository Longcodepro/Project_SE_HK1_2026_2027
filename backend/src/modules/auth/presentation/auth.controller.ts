import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { ForgotPasswordUseCase } from '../application/forgot-password.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { ResendOtpUseCase } from '../application/resend-otp.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { VerifyRegisterOtpUseCase } from '../application/verify-register-otp.use-case';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResendOtpDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUc: RegisterUseCase,
    private readonly verifyUc: VerifyRegisterOtpUseCase,
    private readonly resendUc: ResendOtpUseCase,
    private readonly loginUc: LoginUseCase,
    private readonly forgotUc: ForgotPasswordUseCase,
    private readonly resetUc: ResetPasswordUseCase,
    private readonly logoutUc: LogoutUseCase,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.registerUc.execute(dto);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyUc.execute(dto.phone, dto.code);
  }

  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.resendUc.execute(dto.phone);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.loginUc.execute(dto.phone, dto.password);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotUc.execute(dto.phone);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetUc.execute(dto.phone, dto.code, dto.newPassword);
  }

  @Post('logout')
  @HttpCode(200)
  @Auth()
  logout(@CurrentUser() user: AuthUser) {
    return this.logoutUc.execute(user);
  }
}
