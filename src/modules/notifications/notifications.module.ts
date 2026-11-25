import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailModule } from '../email/email.module';
import { BarbersModule } from '../barbers/barbers.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationEventListener } from './listeners/notification.event.listener';

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
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}