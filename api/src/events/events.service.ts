import { Injectable, Logger } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EmailService } from '../common/email.service';
import * as admin from 'firebase-admin';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private db: admin.firestore.Firestore;

  constructor(private emailService: EmailService) {
    this.db = admin.firestore();
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
    const batch = this.db.batch();
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

      // Commit batch every 500 ops
      if (batchCount >= 400) {
        await batch.commit();
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
    const cleaned: any = {};
    Object.keys(obj).forEach((key) => {
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

  async findAll() {
    const snapshot = await this.db
      .collection('events')
      .orderBy('eventDate', 'asc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.db.collection('events').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();

    // Count attendees in subcollection
    // Note: count() aggregation is available in newer firebase-admin versions.
    // If not, we might need a workaround, but recent versions support it.
    const attendeesCountSnapshot = await this.db
      .collection('events')
      .doc(id)
      .collection('attendees')
      .count()
      .get();
    const attendeesCount = attendeesCountSnapshot.data().count;

    return {
      id: doc.id,
      ...data,
      _count: {
        attendees: attendeesCount,
      },
    };
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
