export interface Event {
  id: string;
  name: string;
  location: string;
  description?: string;
  headerImage?: string;
  signatureImage?: string;
  eventDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  _count: {
    attendees: number;
  };
}

export interface Attendee {
  id: string;
  email: string;
  name: string;
  rut?: string;
  ticketSent: boolean;
  checkedIn: boolean;
  checkInTime?: string;
  eventId: string;
}
