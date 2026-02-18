import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';
import * as admin from 'firebase-admin';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  @Post('make-me-admin')
  @UseGuards(FirebaseAuthGuard)
  async makeAdmin(@Request() req: RequestWithUser) {
    const uid = req.user.uid;
    const email = req.user.email;

    try {
      // Set role to ADMIN in Firestore users collection
      await this.db.collection('users').doc(uid).set(
        {
          role: 'ADMIN',
          email: email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      this.logger.log(`User ${uid} (${email}) granted ADMIN role`);

      return {
        success: true,
        message: 'Admin role granted successfully',
        uid,
        email,
        role: 'ADMIN',
      };
    } catch (error) {
      this.logger.error('Error granting admin role:', error);
      throw error;
    }
  }

  @Get()
  @Roles('ADMIN')
  async getAllUsers() {
    const snapshot = await this.db.collection('users').get();
    return snapshot.docs.map((doc) => doc.data());
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    if (!['ADMIN', 'STAFF', 'USER'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }
    await this.db.collection('users').doc(id).update({ role });
    return { success: true };
  }

  @Patch(':id/block')
  @Roles('ADMIN')
  async toggleUserBlock(
    @Param('id') id: string,
    @Body('isBlocked') isBlocked: boolean,
  ) {
    await this.db.collection('users').doc(id).update({ isBlocked });
    return { success: true };
  }
}
