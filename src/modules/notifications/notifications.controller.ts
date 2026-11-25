import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth-guard';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOkResponse({ description: 'List notifications' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const pp = perPage ? parseInt(perPage, 10) : 20;

    // Derive the target scope from the JWT role (security: never trust query params)
    if (request.user.role === 'customer') {
      return this.notificationsService.findByCustomer(request.user.id, p, pp);
    }
    if (request.user.role === 'barber') {
      return this.notificationsService.findByBarber(request.user.id, p, pp);
    }
    // Default: user notifications
    return this.notificationsService.findByUser(request.user.id, p, pp);
  }

  @Patch(':id/read')
  @ApiOkResponse({ description: 'Notification marked as read' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, request.user.id);
  }

  @Get('unread/count')
  @ApiOkResponse({ description: 'Unread count' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async getUnreadCount(
    @Req() request: AuthenticatedRequest,
  ) {
    // Derive the target scope from the JWT role (security: never trust query params)
    if (request.user.role === 'customer') {
      return {
        count: await this.notificationsService.countByCustomer(request.user.id, false),
      };
    }
    if (request.user.role === 'barber') {
      return {
        count: await this.notificationsService.countByBarber(request.user.id, false),
      };
    }
    // Default: user count
    return {
      count: await this.notificationsService.getUnreadCount(request.user.id),
    };
  }
}