import { IsString, IsOptional, IsDateString, IsUrl } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  headerImage?: string;

  @IsOptional()
  @IsUrl()
  signatureImage?: string;

  @IsDateString()
  eventDate: string;
}
