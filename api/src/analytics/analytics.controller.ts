import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AttendeesService } from '../attendees/attendees.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get('events/:id/staff')
  async getStaffPerformance(@Param('id') eventId: string) {
    const attendees = await this.attendeesService.findAll(eventId);
    
    const performance: Record<string, { email: string; count: number }> = {};

    attendees.forEach((a: any) => {
      if (a.checkedIn && a.checkedInByEmail) {
        if (!performance[a.checkedInByEmail]) {
          performance[a.checkedInByEmail] = {
            email: a.checkedInByEmail,
            count: 0,
          };
        }
        performance[a.checkedInByEmail].count++;
      }
    });

    return Object.values(performance).sort((a, b) => b.count - a.count);
  }

  @Get('summary')
  async getGlobalSummary() {
    // This could be expanded to a list of all events with their stats
    // For now, simpler: we'll handle this in the frontend by fetching all events and their individual stats
    return { status: 'ok' };
  }
}
