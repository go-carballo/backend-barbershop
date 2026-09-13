import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'Barber User',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'barber@barbershop.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: UserRole.BARBER,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
