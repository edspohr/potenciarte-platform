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
  staffIds?: string[];
  diplomaEnabled?: boolean;
  _count?: {
    attendees: number;
  };
}
