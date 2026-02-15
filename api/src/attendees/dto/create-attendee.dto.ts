import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateAttendeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsBoolean()
  checkedIn?: boolean;
}
