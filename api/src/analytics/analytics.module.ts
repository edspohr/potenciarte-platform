import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AttendeesModule } from '../attendees/attendees.module';
import { FirestoreModule } from '../firestore/firestore.module';

@Module({
  imports: [AttendeesModule, FirestoreModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
