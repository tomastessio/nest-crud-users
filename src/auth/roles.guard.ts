import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    // 1) Header x-role tiene prioridad
    // 2) Si algún middleware puso req.user?.role, también sirve
    const headerRole = (req.headers['x-role'] ?? req.headers['X-Role']) as string | undefined;
    const userRole =
      (headerRole || req.user?.role || Role.USER).toString().toUpperCase() as Role;

    return required.includes(userRole);
  }
}
