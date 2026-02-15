import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { Prisma } from '@prisma/client';

interface CsvRow {
  email?: string;
  name?: string;
  rut?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class AttendeesService {
  constructor(private prisma: PrismaService) {}

  async processCsv(eventId: string, fileBuffer: Buffer): Promise<{ count: number; message: string }> {
    const attendees: Prisma.AttendeeCreateManyInput[] = [];
    const stream = Readable.from(fileBuffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: any) => {
          // Normalize keys to lowercase
          const normalizedData: CsvRow = {};
          Object.keys(data).forEach((key) => {
            const value = data[key];
             if (typeof value === 'string') {
              normalizedData[key.toLowerCase()] = value;
             }
          });

          if (normalizedData['email'] && normalizedData['name']) {
            attendees.push({
              email: normalizedData['email'] as string,
              name: normalizedData['name'] as string,
              rut: normalizedData['rut'] || null,
              eventId,
            });
          }
        })
        .on('end', async () => {
          try {
            await this.createMany(attendees);
            resolve({ count: attendees.length, message: 'Processed successfully' });
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        })
        .on('error', (error: unknown) => {
           reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  async createMany(data: Prisma.AttendeeCreateManyInput[]) {
    if (data.length === 0) return;

    return await this.prisma.attendee.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findAll(eventId: string) {
    return await this.prisma.attendee.findMany({
      where: { eventId },
      orderBy: { name: 'asc' },
    });
  }

  async checkIn(eventId: string, attendeeId: string) {
    const attendee = await this.prisma.attendee.findUnique({
      where: { id: attendeeId },
    });

    if (!attendee) {
      throw new BadRequestException('Attendee not found');
    }

    if (attendee.eventId !== eventId) {
      throw new BadRequestException('Attendee does not belong to this event');
    }

    if (attendee.checkedIn) {
      return { ...attendee, message: 'Already checked in' };
    }

    return await this.prisma.attendee.update({
      where: { id: attendeeId },
      data: {
        checkedIn: true,
        checkInTime: new Date(),
      },
    });
  }

  async getStats(eventId: string) {
    const total = await this.prisma.attendee.count({ where: { eventId } });
    const checkedIn = await this.prisma.attendee.count({
      where: { eventId, checkedIn: true },
    });

    return {
      total,
      checkedIn,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    };
  }
}
