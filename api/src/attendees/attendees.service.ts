import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as admin from 'firebase-admin';

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

    const collectionRef = this.db.collection('events').doc(eventId).collection('attendees');
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
    const snapshot = await this.db.collection('events').doc(eventId).collection('attendees')
      .orderBy('name', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async checkIn(eventId: string, attendeeId: string) {
    const attendeeRef = this.db.collection('events').doc(eventId).collection('attendees').doc(attendeeId);
    const attendeeDoc = await attendeeRef.get();

    if (!attendeeDoc.exists) {
      throw new BadRequestException('Attendee not found');
    }

    const attendee = attendeeDoc.data();
    
    // In Firestore subcollection, eventId is implicit in path, but we store it in doc too.
    // Verification is good practice.
    if (attendee?.eventId !== eventId) {
        throw new BadRequestException('Attendee does not belong to this event');
    }

    if (attendee?.checkedIn) {
      return { id: attendeeDoc.id, ...attendee, status: 'already_checked_in' };
    }

    await attendeeRef.update({
      checkedIn: true,
      checkInTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await attendeeRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async getSyncData(eventId: string) {
      return this.findAll(eventId);
  }

  async getStats(eventId: string) {
    const attendeesRef = this.db.collection('events').doc(eventId).collection('attendees');
    
    // Using count() aggregation if supported by current SDK, otherwise fallback to get().size
    // Assuming standard heavy read is okay for now or count() works.
    const totalSnapshot = await attendeesRef.count().get();
    const checkedInSnapshot = await attendeesRef.where('checkedIn', '==', true).count().get();

    const total = totalSnapshot.data().count;
    const checkedIn = checkedInSnapshot.data().count;

    return {
      total,
      checkedIn,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    };
  }
}
