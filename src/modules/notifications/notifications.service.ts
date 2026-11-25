import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: {
    type: NotificationType;
    title: string;
    body: string;
    userId?: string | null;
    customerId?: string | null;
    barberId?: string | null;
    appointmentId?: string | null;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type: dto.type,
      title: dto.title,
      body: dto.body,
      userId: dto.userId,
      customerId: dto.customerId,
      barberId: dto.barberId,
      appointmentId: dto.appointmentId,
    });

    return this.notificationsRepository.save(notification);
  }

  async createBarberNotification(dto: {
    type: NotificationType;
    title: string;
    body: string;
    barberId: string;
    appointmentId: string;
  }): Promise<Notification> {
    return this.create({
      type: dto.type,
      title: dto.title,
      body: dto.body,
      barberId: dto.barberId,
      appointmentId: dto.appointmentId,
    });
  }

  async createCustomerNotification(dto: {
    type: NotificationType;
    title: string;
    body: string;
    customerId: string;
    appointmentId: string;
  }): Promise<Notification> {
    return this.create({
      type: dto.type,
      title: dto.title,
      body: dto.body,
      customerId: dto.customerId,
      appointmentId: dto.appointmentId,
    });
  }

  async findByUser(userId: string, page = 1, perPage = 20): Promise<{
    data: Notification[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const skip = (page - 1) * perPage;

    const [data, total] = await this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: perPage,
    });

    return { data, total, page, perPage };
  }

  async findByCustomer(customerId: string, page = 1, perPage = 20): Promise<{
    data: Notification[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const skip = (page - 1) * perPage;

    const [data, total] = await this.notificationsRepository.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip,
      take: perPage,
    });

    return { data, total, page, perPage };
  }

  async findByBarber(barberId: string, page = 1, perPage = 20): Promise<{
    data: Notification[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const skip = (page - 1) * perPage;

    const [data, total] = await this.notificationsRepository.findAndCount({
      where: { barberId },
      order: { createdAt: 'DESC' },
      skip,
      take: perPage,
    });

    return { data, total, page, perPage };
  }

  /**
   * Mark a notification as read, regardless of target type (user/customer/barber).
   * This method checks all three possible target columns.
   */
  async markAsRead(id: string, currentUserId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: [
        { id, userId: currentUserId },
        { id, customerId: currentUserId },
        { id, barberId: currentUserId },
      ],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    notification.read = true;
    return this.notificationsRepository.save(notification);
  }

  /**
   * Count unread notifications by target type (user/customer/barber).
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, read: false },
    });
  }

  async countByCustomer(customerId: string, read: boolean): Promise<number> {
    return this.notificationsRepository.count({
      where: { customerId, read },
    });
  }

  async countByBarber(barberId: string, read: boolean): Promise<number> {
    return this.notificationsRepository.count({
      where: { barberId, read },
    });
  }
}