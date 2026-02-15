import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
