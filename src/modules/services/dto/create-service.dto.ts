import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de cabello' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Corte de cabello con máquinas y tijeras' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 1500.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
