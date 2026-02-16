import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { EventsModule } from './events/events.module';
import { AttendeesModule } from './attendees/attendees.module';
import { EmailModule } from './common/email.module';
import { DiplomasModule } from './diplomas/diplomas.module';

@Module({
  imports: [PrismaModule, EventsModule, AttendeesModule, EmailModule, DiplomasModule],
  controllers: [AppController, AuthController],
  providers: [AppService, UsersService],
})
export class AppModule {}
