import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { Barber } from './entities/barber.entity';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { ListBarbersQueryDto } from './dto/list-barbers.query.dto';

import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.auth-guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ListBarbersResponseDto } from './dto/list-barbers-response.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('barbers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid authentication token',
})
@ApiForbiddenResponse({
  description: 'Insufficient permissions',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'List barbers' })
  @ApiOkResponse({
    description: 'Barbers list',
    type: ListBarbersResponseDto,
  })
  findAll(@Query() query: ListBarbersQueryDto) {
    return this.barbersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'Get barber by id' })
  @ApiParam({
    name: 'id',
    description: 'Barber UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({ description: 'Barber found', type: Barber })
  @ApiNotFoundResponse({ description: 'Barber not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.barbersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create barber' })
  @ApiCreatedResponse({ description: 'Barber created', type: Barber })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateBarberDto): Promise<Barber> {
    return this.barbersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update barber' })
  @ApiParam({ name: 'id', description: 'Barber UUID' })
  @ApiOkResponse({
    description: 'Barber updated successfully',
    type: Barber,
  })
  @ApiNotFoundResponse({ description: 'Barber not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or validation failed',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBarberDto,
  ) {
    return this.barbersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete barber' })
  @ApiParam({ name: 'id', description: 'Barber UUID' })
  @ApiOkResponse({ description: 'Barber deleted successfully' })
  @ApiNotFoundResponse({ description: 'Barber not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.barbersService.remove(id);
  }
}
