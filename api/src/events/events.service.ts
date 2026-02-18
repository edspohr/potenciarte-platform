import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EmailService } from '../common/email.service';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private db: admin.firestore.Firestore;

  constructor(private emailService: EmailService) {
    this.db = admin.firestore();
  }

  // ... (keep sendInvitations, removeUndefined, create, serializeFirestoreData existing methods as is)

  async findAll(user: DecodedIdToken) {
    this.logger.log(`Fetching events for user ${user.email} (${user.role})`);
    
    let query: admin.firestore.Query = this.db.collection('events');

    // Filter for STAFF
    if (user.role === 'STAFF') {
       query = query.where('staffIds', 'array-contains', user.uid);
    }

    const snapshot = await query.orderBy('eventDate', 'asc').get();
    
    this.logger.log(`Found ${snapshot.docs.length} events`);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(this.serializeFirestoreData(doc.data()) as Record<string, unknown>),
    }));
  }

  async findOne(id: string, user?: DecodedIdToken) {
    const doc = await this.db.collection('events').doc(id).get();
    if (!doc.exists) return null;

    const eventData = doc.data() as any;

    // Security Check for STAFF
    if (user && user.role === 'STAFF') {
      const staffIds = eventData.staffIds || [];
      if (!staffIds.includes(user.uid)) {
        throw new ForbiddenException('You are not assigned to this event.');
      }
    }

    // Aggregations for Stepper and Stats
    const attendeesSnapshot = await this.db
      .collection('events')
      .doc(id)
      .collection('attendees')
      .get();

    const attendeesCount = attendeesSnapshot.size;
    const hasSentTickets = attendeesSnapshot.docs.some(
      (d) => d.data().ticketSent === true,
    );

    return {
      id: doc.id,
      ...(this.serializeFirestoreData(eventData) as Record<string, unknown>),
      _count: {
        attendees: attendeesCount,
      },
      _progress: {
        hasAttendees: attendeesCount > 0,
        hasTemplate: !!eventData?.diplomaTemplatePath,
        hasSentTickets: hasSentTickets,
        isPublished: eventData?.status === 'PUBLISHED',
      },
    };
  }

  async sendInvitations(eventId: string) {
    const eventRef = this.db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }

    const attendeesSnapshot = await eventRef
      .collection('attendees')
      .where('ticketSent', '==', false)
      .get();

    this.logger.log(
      `Found ${attendeesSnapshot.size} pending invitations for event ${eventData.name}`,
    );

    let sentCount = 0;
    let batch = this.db.batch();
    let batchCount = 0;

    for (const doc of attendeesSnapshot.docs) {
      const attendee = doc.data();
      const success = await this.emailService.sendInvitation(
        attendee.email as string,
        attendee.name as string,
        doc.id,
        eventData.name as string,
      );

      if (success) {
        batch.update(doc.ref, { ticketSent: true });
        batchCount++;
        sentCount++;
      }

      // Commit batch every 500 ops (Firestore limit)
      if (batchCount >= 400) {
        await batch.commit();
        batch = this.db.batch(); // Create a new batch for the remaining items
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return {
      message: `Sent ${sentCount} invitations`,
      total: attendeesSnapshot.size,
    };
  }

  // Helper to remove undefined values (Firestore doesn't accept them)
  private removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    (Object.keys(obj) as Array<keyof T>).forEach((key) => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }

  async create(createEventDto: CreateEventDto) {
    try {
      this.logger.log('Creating new event...');
      const eventData = this.removeUndefined({
        ...createEventDto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'DRAFT',
      });

      const res = await this.db.collection('events').add(eventData);
      this.logger.log(`Event created with ID: ${res.id}`);
      return { id: res.id, ...eventData };
    } catch (error) {
      this.logger.error('Error creating event in Firestore:', error);
      throw error;
    }
  }

  // Helper to serialize Firestore data (convert Timestamps to ISO strings)
  private serializeFirestoreData(data: unknown): unknown {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.serializeFirestoreData(item));
    }

    // Handle Firestore Timestamp objects
    if (data instanceof admin.firestore.Timestamp) {
      return data.toDate().toISOString();
    }

    // Handle plain objects
    if (typeof data === 'object' && data !== null) {
      const serialized: Record<string, unknown> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          serialized[key] = this.serializeFirestoreData(
            (data as Record<string, unknown>)[key],
          );
        }
      }
      return serialized;
    }

    // Return primitive values as-is
    return data;
  }


  async update(id: string, updateEventDto: UpdateEventDto) {
    const docRef = this.db.collection('events').doc(id);
    const updateData = this.removeUndefined({
      ...updateEventDto,
      updatedAt: new Date().toISOString(),
    });
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async remove(id: string) {
    await this.db.collection('events').doc(id).delete();
    return { id };
  }
}
