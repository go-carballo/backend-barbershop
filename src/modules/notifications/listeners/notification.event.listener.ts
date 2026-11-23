import { OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../../email/email.service';
import { Barber } from '../../barbers/entities/barber.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { BarbersService } from '../../barbers/barbers.service';
import { CustomersService } from '../../customers/customers.service';
import type { AppointmentStatusChangedEvent, AppointmentCreatedEvent } from '../dto/notification-events.dto';

export const EVENT_APPOINTMENT_CREATED = 'appointment.created';
export const EVENT_APPOINTMENT_STATUS_CHANGED = 'appointment.status_changed';

export class NotificationEventListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly barbersService: BarbersService,
    private readonly customersService: CustomersService,
  ) {}

  async onModuleInit() {
    this.logger.log('Notification event listener registered');
  }

  @OnEvent(EVENT_APPOINTMENT_CREATED)
  async handleAppointmentCreated(payload: AppointmentCreatedEvent) {
    try {
      const { appointmentId, customerId, barberId, appointmentDate, startTime, serviceName } = payload;
      const title = 'Nueva cita confirmada';
      const body = `Se agendó una cita con ${serviceName} el ${appointmentDate} a las ${startTime}.`;

      // Notify barber (via barber entity)
      await this.notificationsService.createBarberNotification({
        type: 'appointment_created',
        title,
        body,
        barberId,
        appointmentId,
      });

      // Send email to barber if they have one
      const barber = await this.barbersService.findOne(barberId);
      if (barber && barber.email) {
        await this.emailService.send({
          to: barber.email,
          subject: 'Nueva cita confirmada',
          html: `<p>Se agendó una cita:</p>
                 <ul>
                   <li><strong>Servicio:</strong> ${serviceName}</li>
                   <li><strong>Fecha:</strong> ${appointmentDate}</li>
                   <li><strong>Hora:</strong> ${startTime}</li>
                 </ul>`,
          text: `Nueva cita: ${serviceName} el ${appointmentDate} a las ${startTime}`,
        });
      }

      // Notify customer (via customer entity)
      const customer = await this.customersService.findOne(customerId);
      if (customer) {
        await this.notificationsService.createCustomerNotification({
          type: 'appointment_created',
          title,
          body,
          customerId,
          appointmentId,
        });

        // Send email to customer if they have one
        if (customer.email) {
          await this.emailService.send({
            to: customer.email,
            subject: 'Nueva cita confirmada',
            html: `<p>Se agendó una cita:</p>
                   <ul>
                     <li><strong>Servicio:</strong> ${serviceName}</li>
                     <li><strong>Fecha:</strong> ${appointmentDate}</li>
                     <li><strong>Hora:</strong> ${startTime}</li>
                   </ul>`,
            text: `Nueva cita: ${serviceName} el ${appointmentDate} a las ${startTime}`,
          });
        }
      }

      this.logger.log(`Notifications sent for appointment ${appointmentId}`);
    } catch (err) {
      this.logger.error(`Failed to send appointment created notifications:`, err);
    }
  }

  @OnEvent(EVENT_APPOINTMENT_STATUS_CHANGED)
  async handleAppointmentStatusChanged(payload: AppointmentStatusChangedEvent) {
    try {
      const { appointmentId, customerId, barberId, appointmentDate, startTime, fromStatus, toStatus, serviceName } = payload;

      if (fromStatus === toStatus) return; // Skip if no actual status change

      let title: string;
      let body: string;

      switch (toStatus) {
        case 'confirmed':
          title = 'Cita confirmada';
          body = `Tu cita de ${serviceName} el ${appointmentDate} a las ${startTime} fue confirmada.`;
          break;
        case 'cancelled':
          title = 'Cita cancelada';
          body = `Tu cita de ${serviceName} el ${appointmentDate} a las ${startTime} fue cancelada.`;
          break;
        case 'completed':
          title = 'Cita completada';
          body = `Tu cita de ${serviceName} el ${appointmentDate} a las ${startTime} fue completada.`;
          break;
        default:
          return; // No notification for other status transitions
      }

      // Notify customer (via customer entity)
      const customer = await this.customersService.findOne(customerId);
      if (customer) {
        await this.notificationsService.createCustomerNotification({
          type: `appointment_${toStatus}` as any,
          title,
          body,
          customerId,
          appointmentId,
        });

        // Send email to customer if they have one
        if (customer.email) {
          await this.emailService.send({
            to: customer.email,
            subject: title,
            html: `<p>${body}</p>`,
            text: body,
          });
        }
      }

      this.logger.log(`Status change notification sent: ${toStatus} for appointment ${appointmentId}`);
    } catch (err) {
      this.logger.error(`Failed to send status change notification:`, err);
    }
  }
}