import { ApiProperty } from '@nestjs/swagger';
import { Barber } from '../entities/barber.entity';

export class ListBarbersResponseDto {
  @ApiProperty({
    type: Barber,
    isArray: true,
  })
  data!: Barber[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  perPage!: number;
}