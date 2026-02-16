import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [EmailModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
