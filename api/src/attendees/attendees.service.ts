import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

interface CsvRow {
  email?: string;
  name?: string;
  rut?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class AttendeesService {
  private db: admin.firestore.Firestore;
  private readonly logger = new Logger(AttendeesService.name);

  constructor() {
    this.db = admin.firestore();
  }

  // ... (keep processCsv, createMany, findAll, search existing methods as is)

  async checkIn(
    eventId: string,
    attendeeId: string,
    user: DecodedIdToken,
  ) {
    // 1. Verify Staff Access
    if (user.role === 'STAFF') {
      const eventDoc = await this.db.collection('events').doc(eventId).get();
      if (!eventDoc.exists) {
        throw new BadRequestException('Event not found');
      }
      const eventData = eventDoc.data();
      const staffIds = eventData?.staffIds || [];
      
      if (!staffIds.includes(user.uid)) {
        throw new ForbiddenException('You are not assigned to this event.');
      }
    }

    const attendeeRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .doc(attendeeId);
    const attendeeDoc = await attendeeRef.get();

    if (!attendeeDoc.exists) {
      throw new BadRequestException('Attendee not found');
    }

    const attendee = attendeeDoc.data();

    if (attendee?.eventId !== eventId) {
      throw new BadRequestException('Attendee does not belong to this event');
    }

    if (attendee?.checkedIn) {
      return { id: attendeeDoc.id, ...attendee, status: 'already_checked_in' };
    }

    const updateData: any = {
      checkedIn: true,
      checkInTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkedInByUID: user.uid,
      checkedInByEmail: user.email || '',
    };

    await attendeeRef.update(updateData);

    const updatedDoc = await attendeeRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async processCsv(
    eventId: string,
    fileBuffer: Buffer,
  ): Promise<{ count: number; message: string }> {
    const attendees: any[] = [];
    const stream = Readable.from(fileBuffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: unknown) => {
          const row = data as Record<string, unknown>;
          const normalizedData: CsvRow = {};
          Object.keys(row).forEach((key) => {
            const value = row[key];
            if (typeof value === 'string') {
              normalizedData[key.toLowerCase()] = value;
            }
          });

          if (normalizedData['email'] && normalizedData['name']) {
            attendees.push({
              email: normalizedData['email'],
              name: normalizedData['name'],
              rut: normalizedData['rut'] || null,
              eventId,
              checkedIn: false,
              ticketSent: false,
              diplomaSent: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        })
        .on('end', () => {
          void (async () => {
            try {
              await this.createMany(eventId, attendees);
              resolve({
                count: attendees.length,
                message: 'Processed successfully',
              });
            } catch (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          })();
        })
        .on('error', (error: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  async createMany(eventId: string, data: any[]) {
    if (data.length === 0) return;

    const collectionRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees');
    const batchArray = [];
    let batchIndex = 0;
    batchArray[batchIndex] = this.db.batch();
    let counter = 0;

    for (const attendee of data) {
      const docRef = collectionRef.doc(); // Auto-ID
      batchArray[batchIndex].set(docRef, attendee);
      counter++;

      if (counter === 499) {
        batchIndex++;
        batchArray[batchIndex] = this.db.batch();
        counter = 0;
      }
    }

    for (const batch of batchArray) {
      await batch.commit();
    }
  }

  async findAll(eventId: string) {
    const snapshot = await this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async search(eventId: string, query: string) {
    // Firestore doesn't support full-text search natively,
    // so we fetch all and filter server-side (fine for event-scale data)
    const snapshot = await this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .get();

    const q = query.toLowerCase();
    const results = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((a: any) =>
        (a.name as string)?.toLowerCase().includes(q) ||
        (a.email as string)?.toLowerCase().includes(q) ||
        (a.rut as string)?.toLowerCase().includes(q),
      )
      .slice(0, 15);

    return results;
  }


  async getSyncData(eventId: string) {
    return this.findAll(eventId);
  }

  async getStats(eventId: string) {
    const attendeesRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees');

    const totalSnapshot = await attendeesRef.count().get();
    const checkedInSnapshot = await attendeesRef
      .where('checkedIn', '==', true)
      .count()
      .get();

    const total = totalSnapshot.data().count;
    const checkedIn = checkedInSnapshot.data().count;

    return {
      total,
      checkedIn,
      pending: total - checkedIn,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    };
  }
}
