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
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendeesService } from './attendees.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('events/:eventId/attendees')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post('upload')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attendeesService.processCsv(eventId, file.buffer);
  }

  @Post('check-in')
  @Roles('ADMIN', 'STAFF')
  async checkIn(
    @Param('eventId') eventId: string,
    @Body('attendeeId') attendeeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.attendeesService.checkIn(eventId, attendeeId, req.user);
  }

  @Get('stats')
  @Roles('ADMIN', 'STAFF')
  async getStats(@Param('eventId') eventId: string) {
    return this.attendeesService.getStats(eventId);
  }

  @Get('sync')
  @Roles('ADMIN', 'STAFF')
  async getSyncData(@Param('eventId') eventId: string) {
    return this.attendeesService.getSyncData(eventId);
  }

  @Get('search')
  @Roles('ADMIN', 'STAFF')
  async search(
    @Param('eventId') eventId: string,
    @Query('q') query: string,
  ) {
    return this.attendeesService.search(eventId, query || '');
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  findAll(@Param('eventId') eventId: string) {
    return this.attendeesService.findAll(eventId);
  }
}
