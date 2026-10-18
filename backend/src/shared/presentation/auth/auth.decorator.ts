import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthUser, Role } from '../../domain/auth-user';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from './roles.guard';

// @Auth() bắt buộc đăng nhập; @Auth('MANAGER') giới hạn vai trò. Chưa đăng nhập 401, sai vai trò 403.
export const Auth = (...roles: Role[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), SetMetadata(ROLES_KEY, roles), ApiBearerAuth());

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);
