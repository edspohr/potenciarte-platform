import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RequestWithUser } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.uid) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const userRole = user.role as string | undefined;

      if (!userRole) {
        this.logger.warn(`User ${user.uid} has no role claim assigned`);
        throw new ForbiddenException('User has no role assigned');
      }

      // Check if user's role matches any of the required roles
      const hasRole = requiredRoles.includes(userRole);

      if (!hasRole) {
        this.logger.warn(
          `ACCESS DENIED: User ${user.uid} with role ${userRole} attempted to access endpoint requiring: ${requiredRoles.join(', ')}`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
        );
      }

      this.logger.log(
        `ACCESS GRANTED: User ${user.uid} with role ${userRole} authorized for roles: ${requiredRoles.join(', ')}`,
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error checking user role:', error);
      throw new ForbiddenException('Error verifying user permissions');
    }
  }
}
