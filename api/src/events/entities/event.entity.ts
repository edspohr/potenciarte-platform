export interface Event {
  id?: string;
  name: string;
  location: string;
  description?: string;
  headerImage?: string;
  signatureImage?: string;
  eventDate: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    attendees: number;
  };
}
