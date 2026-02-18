import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { EventsModule } from './events/events.module';
import { AttendeesModule } from './attendees/attendees.module';
import { EmailModule } from './common/email.module';
import { DiplomasModule } from './diplomas/diplomas.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthController } from './auth/auth.controller';
import { FirestoreModule } from './firestore/firestore.module';

@Module({
  imports: [
    FirestoreModule,
    EventsModule,
    AttendeesModule,
    EmailModule,
    DiplomasModule,
    AnalyticsModule,
  ],
  controllers: [AppController, AuthController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {}
