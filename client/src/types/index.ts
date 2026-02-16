export interface Event {
  id: string;
  name: string;
  location: string;
  description?: string;
  headerImage?: string;
  signatureImage?: string;
  eventDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  diplomaTemplateUrl?: string;
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
  checkedIn: boolean;
  checkInTime?: string;
  ticketSent: boolean;
  diplomaSent: boolean;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}
