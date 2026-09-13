import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../entities/customer.entity';

export class ListCustomersResponseDto {
  @ApiProperty({
    type: Customer,
    isArray: true,
  })
  data!: Customer[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  perPage!: number;
}