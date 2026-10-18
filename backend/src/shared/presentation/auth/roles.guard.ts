import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../domain/domain.error';
import { AuthUser, Role } from '../../domain/auth-user';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles || roles.length === 0) return true;
    const user: AuthUser = context.switchToHttp().getRequest().user;
    if (!roles.includes(user.role)) throw new ForbiddenError('Bạn không có quyền thực hiện thao tác này');
    return true;
  }
}
