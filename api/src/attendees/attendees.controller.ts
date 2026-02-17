import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendeesService } from './attendees.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('events/:eventId/attendees')
@UseGuards(FirebaseAuthGuard)
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attendeesService.processCsv(eventId, file.buffer);
  }

  @Post('check-in')
  async checkIn(
    @Param('eventId') eventId: string,
    @Body('attendeeId') attendeeId: string,
  ) {
    return this.attendeesService.checkIn(eventId, attendeeId);
  }

  @Get('stats')
  async getStats(@Param('eventId') eventId: string) {
    return this.attendeesService.getStats(eventId);
  }

  @Get('sync')
  async getSyncData(@Param('eventId') eventId: string) {
    return this.attendeesService.getSyncData(eventId);
  }

  @Get('search')
  async search(
    @Param('eventId') eventId: string,
    @Query('q') query: string,
  ) {
    return this.attendeesService.search(eventId, query || '');
  }

  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.attendeesService.findAll(eventId);
  }
}
