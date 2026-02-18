import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  headerImage?: string;

  @IsOptional()
  @IsString()
  signatureImage?: string;

  @IsDateString()
  eventDate: string;
}
