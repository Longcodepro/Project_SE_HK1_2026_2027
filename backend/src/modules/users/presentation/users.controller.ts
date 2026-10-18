import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { ChangePasswordUseCase, GetMeUseCase, UpdateProfileUseCase } from '../application/profile.use-cases';
import { ChangePasswordDto, UpdateProfileDto } from './dto/users.dto';

// Mọi vai trò đã đăng nhập đều xem và sửa được hồ sơ của chính mình (nhân viên cũng cần đổi mật khẩu, BR46)
@ApiTags('users')
@Controller('users/me')
@Auth()
export class UsersController {
  constructor(
    private readonly getMe: GetMeUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.getMe.execute(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute(user.id, dto);
  }

  @Patch('password')
  password(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.changePassword.execute(user.id, dto.oldPassword, dto.newPassword);
  }
}
