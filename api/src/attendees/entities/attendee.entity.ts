export interface Attendee {
  id?: string;
  eventId: string;
  email: string;
  name: string;
  rut?: string | null;
  checkedIn: boolean;
  checkInTime?: string | null;
  ticketSent: boolean;
  diplomaSent: boolean;
  createdAt?: string;
  updatedAt?: string;
}
