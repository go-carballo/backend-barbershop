import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Corte de cabello' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Corte de cabello con máquinas y tijeras' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 1500.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
