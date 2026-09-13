import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,  
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListAppointmentsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Page number (starts at 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 10;

  @ApiPropertyOptional({
    example: '',
    description: 'Filter by customer UUID',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Filter by barber UUID',
  })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Filter by service UUID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Filter by appointment date',
  })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @ApiPropertyOptional({
    example: 'scheduled',
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}
