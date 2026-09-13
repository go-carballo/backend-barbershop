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

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { ListAppointmentsResponseDto } from './dto/list-appointments-response.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('appointments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid authentication token',
})
@ApiForbiddenResponse({
  description: 'Insufficient permissions',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'List appointments with pagination' })
  @ApiOkResponse({
    description: 'Paginated appointments list',
    type: ListAppointmentsResponseDto,
  })
  findAll(@Query() query: ListAppointmentsQueryDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'Get appointment by id' })
  @ApiParam({
    name: 'id',
    description: 'Appointment UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({ description: 'Appointment found', type: Appointment })
  @ApiNotFoundResponse({ description: 'Appointment not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'Create appointment' })
  @ApiCreatedResponse({ description: 'Appointment created', type: Appointment })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({
    description:
      'Appointment conflict, invalid time range or inactive related resource',
  })
  create(@Body() dto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiOkResponse({
    description: 'Appointment updated successfully',
    type: Appointment,
  })
  @ApiNotFoundResponse({ description: 'Appointment not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or validation failed',
  })
  @ApiConflictResponse({
    description:
      'Appointment conflict, invalid time range or inactive related resource',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')  
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiOkResponse({ description: 'Appointment deleted successfully' })
  @ApiNotFoundResponse({ description: 'Appointment not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.remove(id);
  }
}
