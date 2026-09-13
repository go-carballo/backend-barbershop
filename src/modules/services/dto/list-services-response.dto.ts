import { ApiProperty } from '@nestjs/swagger';
import { Service } from '../entities/service.entity';

export class ListServicesResponseDto {
  @ApiProperty({
    type: Service,
    isArray: true,
  })
  data!: Service[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  perPage!: number;
}