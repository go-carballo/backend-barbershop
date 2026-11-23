import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailModule } from '../email/email.module';
import { BarbersModule } from '../barbers/barbers.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationEventListener } from './listeners/notification.event.listener';
import { BarbersService } from '../barbers/barbers.service';
import { CustomersService } from '../customers/customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    EmailModule,
    BarbersModule,
    CustomersModule,
  ],
  providers: [
    NotificationsService,
    NotificationEventListener,
    BarbersService,
    CustomersService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}