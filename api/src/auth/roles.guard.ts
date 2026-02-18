import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { ROLES_KEY } from './roles.decorator';
import { RequestWithUser } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  private db: admin.firestore.Firestore;

  constructor(private reflector: Reflector) {
    this.db = admin.firestore();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      // Fetch user document from Firestore to get role
      const userDoc = await this.db.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        this.logger.warn(`User document not found for UID: ${user.uid}`);
        throw new ForbiddenException('User profile not found');
      }

      const userData = userDoc.data();
      const userRole = userData?.role;

      if (!userRole) {
        this.logger.warn(`User ${user.uid} has no role assigned`);
        throw new ForbiddenException('User has no role assigned');
      }

      // Check if user's role matches any of the required roles
      const hasRole = requiredRoles.includes(userRole);

      if (!hasRole) {
        this.logger.warn(
          `User ${user.uid} with role ${userRole} attempted to access endpoint requiring roles: ${requiredRoles.join(', ')}`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
        );
      }

      this.logger.log(
        `User ${user.uid} with role ${userRole} authorized for endpoint`,
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
