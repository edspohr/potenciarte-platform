import {
  Controller,
  Post,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import * as admin from 'firebase-admin';

@Controller('users')
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
}
