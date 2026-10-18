import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsOtpCode, IsPhone, LowerCase, Trim } from '../../../../shared/presentation/validators';

export class RegisterDto {
  @IsPhone() phone!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(100)
  password!: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @LowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string;
}

export class VerifyOtpDto {
  @IsPhone() phone!: string;
  @IsOtpCode() code!: string;
}

export class ResendOtpDto {
  @IsPhone() phone!: string;
}

export class LoginDto {
  @IsPhone() phone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgotPasswordDto {
  @IsPhone() phone!: string;
}

export class ResetPasswordDto {
  @IsPhone() phone!: string;
  @IsOtpCode() code!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới tối thiểu 8 ký tự' })
  @MaxLength(100)
  newPassword!: string;
}
