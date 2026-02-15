import Dexie, { Table } from 'dexie';

export interface LocalAttendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  rut?: string;
  checkedIn: boolean;
  checkInTime?: Date;
  ticketSent: boolean;
  syncStatus: 'synced' | 'pending_checkin'; // To track offline changes
}

export class PotenciarteDatabase extends Dexie {
  attendees!: Table<LocalAttendee>;

  constructor() {
    super('PotenciarteDatabase');
    this.version(1).stores({
      attendees: 'id, eventId, rut, email, [eventId+rut]', // Indexes for fast search
    });
  }
}

export const db = new PotenciarteDatabase();
