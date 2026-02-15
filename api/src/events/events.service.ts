import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EmailService } from '../common/email.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ... existing methods ...

  async sendInvitations(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new Error('Event not found');
    }

    const attendees = await this.prisma.attendee.findMany({
      where: { eventId, ticketSent: false },
    });

    this.logger.log(
      `Found ${attendees.length} pending invitations for event ${event.name}`,
    );

    let sentCount = 0;
    for (const attendee of attendees) {
      const success = await this.emailService.sendInvitation(
        attendee.email,
        attendee.name,
        attendee.id,
        event.name,
      );

      if (success) {
        await this.prisma.attendee.update({
          where: { id: attendee.id },
          data: { ticketSent: true },
        });
        sentCount++;
      }
    }

    return {
      message: `Sent ${sentCount} invitations`,
      total: attendees.length,
    };
  }

  create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: createEventDto,
    });
  }

  findAll() {
    return this.prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attendees: true },
        },
      },
    });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
