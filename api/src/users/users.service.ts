import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async syncProfile(user: any): Promise<User> {
    const { uid, email, name, picture } = user;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: uid },
    });

    if (existingUser) {
      return existingUser;
    }

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.STAFF;

    return this.prisma.user.create({
      data: {
        id: uid,
        email: email,
        fullName: name || 'Unknown',
        role,
      },
    });
  }
}
