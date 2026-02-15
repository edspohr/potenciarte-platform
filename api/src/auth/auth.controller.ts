import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}

  @UseGuards(FirebaseAuthGuard)
  @UseGuards(FirebaseAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    const user = await this.usersService.syncProfile(req.user);
    return {
      message: `Hello ${user.role}`,
      user,
    };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
