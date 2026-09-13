import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Customer UUID', example: '' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ description: 'Barber UUID', example: '' })
  @IsUUID()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ description: 'Service UUID', example: '' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: '2026-03-30' })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate!: string;

  @ApiProperty({ example: '10:00:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'startTime must be in HH:mm:ss format',
  })
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '10:30:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'endTime must be in HH:mm:ss format',
  })
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({
    example: AppointmentStatus.SCHEDULED,
    enum: AppointmentStatus,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Cliente pidió corte degrade' })
  @IsString()
  @IsOptional()
  notes?: string;
}
