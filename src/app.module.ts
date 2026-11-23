import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/env/validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './config/database/typeorm.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationEventListener } from './modules/notifications/listeners/notification.event.listener';

@Module({
  imports: [
    //Event emitter (decouples appointment events from notification sending)
    EventEmitterModule.forRoot(),
    //Env y config global
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    //config db
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createTypeOrmOptions(configService),
    }),
    //App modules    
    AuthModule,
    UsersModule,
    CustomersModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    NotificationsModule,
    EmailModule,
  ],
  controllers: [],
  providers: [NotificationEventListener],
})
export class AppModule {}
