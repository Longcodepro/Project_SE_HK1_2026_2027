import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageQuery } from '../../../../shared/presentation/page-query.dto';
import { IsPhone, LowerCase, ToBoolean, Trim } from '../../../../shared/presentation/validators';

export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100)
  fullName?: string;

  // null để xóa email
  @IsOptional()
  @LowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string | null;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới tối thiểu 8 ký tự' })
  @MaxLength(100)
  newPassword!: string;
}

export class UserListQuery extends PageQuery {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @IsEnum(['CUSTOMER', 'STAFF', 'MANAGER'])
  role?: 'CUSTOMER' | 'STAFF' | 'MANAGER';

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;
}

export class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class CreateStaffDto {
  @IsPhone() phone!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @LowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string;
}
