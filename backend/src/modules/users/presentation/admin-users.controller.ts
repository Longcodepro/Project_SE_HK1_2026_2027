import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, MANAGER_ONLY } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { CreateStaffUseCase, GetUserDetailUseCase, ListUsersUseCase, SetUserActiveUseCase } from '../application/admin-users.use-cases';
import { CreateStaffDto, SetActiveDto, UserListQuery } from './dto/users.dto';

@ApiTags('admin-users')
@Controller('admin')
@Auth(...MANAGER_ONLY)
export class AdminUsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly userDetail: GetUserDetailUseCase,
    private readonly setActive: SetUserActiveUseCase,
    private readonly createStaff: CreateStaffUseCase,
  ) {}

  @Get('users')
  list(@Query() q: UserListQuery) {
    return this.listUsers.execute({ search: q.search, role: q.role, isActive: q.isActive }, { page: q.page, pageSize: q.pageSize });
  }

  @Get('users/:id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.userDetail.execute(id);
  }

  @Patch('users/:id/active')
  active(@CurrentUser() actor: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: SetActiveDto) {
    return this.setActive.execute(actor.id, id, dto.isActive);
  }

  @Post('staff')
  staff(@Body() dto: CreateStaffDto) {
    return this.createStaff.execute(dto);
  }
}
