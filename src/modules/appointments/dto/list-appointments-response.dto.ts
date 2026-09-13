import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../entities/appointment.entity';

export class ListAppointmentsResponseDto {
  @ApiProperty({
    type: Appointment,
    isArray: true,
  })
  data!: Appointment[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  perPage!: number;
}