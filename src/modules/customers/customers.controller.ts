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

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './entities/customer.entity';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customer.query.dto';

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
import { ListCustomersResponseDto } from './dto/list-customers-response.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('customers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid authentication token',
})
@ApiForbiddenResponse({
  description: 'Insufficient permissions',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'List customers with pagination' })
  @ApiOkResponse({
    description: 'Paginated customers list',
    type: ListCustomersResponseDto,
  })
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.BARBER)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiParam({
    name: 'id',
    description: 'Customer UUID',
    example: '',
  })
  @ApiOkResponse({ description: 'Customer found', type: Customer })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create customer' })
  @ApiCreatedResponse({ description: 'Customer created', type: Customer })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiOkResponse({
    description: 'Customer updated successfully',
    type: Customer,
  })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or validation failed',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiOkResponse({ description: 'Customer deleted successfully' })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.customersService.remove(id);
  }
}
