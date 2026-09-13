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

import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Service } from './entities/service.entity';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesQueryDto } from './dto/list-services.query.dto';

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
import { ListServicesResponseDto } from './dto/list-services-response.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('services')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid authentication token',
})
@ApiForbiddenResponse({
  description: 'Insufficient permissions',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'List services with pagination' })
  @ApiOkResponse({
    description: 'Paginated Services list',
    type: ListServicesResponseDto,
  })
  findAll(@Query() query: ListServicesQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'Get service by id' })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '',
  })
  @ApiOkResponse({ description: 'Service found', type: Service })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create service' })
  @ApiCreatedResponse({ description: 'Service created', type: Service })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiOkResponse({
    description: 'Service updated successfully',
    type: Service,
  })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or validation failed',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiOkResponse({ description: 'Service deleted successfully' })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesService.remove(id);
  }
}
