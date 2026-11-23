import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EVENT_APPOINTMENT_CREATED,
  EVENT_APPOINTMENT_STATUS_CHANGED,
} from '../notifications/listeners/notification.event.listener';

@Injectable()
export class AppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Barber)
    private readonly barbersRepository: Repository<Barber>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('AppointmentsService initialized with event emitter');
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer', 'barber', 'service'],
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const oldStatus = appointment.status;

    if (dto.customerId !== undefined) {
      await this.validateCustomer(dto.customerId);
      appointment.customerId = dto.customerId;
    }
    if (dto.barberId !== undefined) {
      await this.validateBarber(dto.barberId);
      appointment.barberId = dto.barberId;
    }
    if (dto.serviceId !== undefined) {
      await this.validateService(dto.serviceId);
      appointment.serviceId = dto.serviceId;
    }
    if (dto.appointmentDate !== undefined) {
      appointment.appointmentDate = dto.appointmentDate;
    }
    if (dto.startTime !== undefined) {
      appointment.startTime = dto.startTime;
    }
    if (dto.endTime !== undefined) {
      appointment.endTime = dto.endTime;
    }
    if (dto.status !== undefined) {
      appointment.status = dto.status;
    }
    if (dto.notes !== undefined) {
      appointment.notes = dto.notes ?? null;
    }

    if (
      dto.barberId !== undefined ||
      dto.appointmentDate !== undefined ||
      dto.startTime !== undefined
    ) {
      const barberId = dto.barberId ?? appointment.barberId;
      const appointmentDate =
        dto.appointmentDate ?? appointment.appointmentDate;
      const startTime = dto.startTime ?? appointment.startTime;
      const endTime = dto.endTime ?? appointment.endTime;

      this.validateTimeRange(startTime, endTime);
      await this.checkConflict(
        barberId,
        appointmentDate,
        startTime,
        endTime,
        id,
      );
    }

    const saved = await this.appointmentsRepository.save(appointment);

    // Emit status change event
    if (dto.status && dto.status !== oldStatus) {
      const full = await this.findOne(id);
      const service = await this.servicesRepository.findOne({ where: { id: full.serviceId } });
      void this.eventEmitter.emit(EVENT_APPOINTMENT_STATUS_CHANGED, {
        appointmentId: full.id,
        customerId: full.customerId,
        barberId: full.barberId,
        serviceId: full.serviceId,
        appointmentDate: full.appointmentDate,
        startTime: full.startTime,
        endTime: full.endTime,
        fromStatus: oldStatus,
        toStatus: dto.status,
        serviceName: service?.name,
      });
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.appointmentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Appointment not found.');
    }
  }

  async findAll(query: ListAppointmentsQueryDto): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const {
      page = 1,
      perPage = 10,
      customerId,
      barberId,
      serviceId,
      appointmentDate,
      status,
    } = query;
    const skip = (page - 1) * perPage;

    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .leftJoinAndSelect('appointment.barber', 'barber')
      .leftJoinAndSelect('appointment.service', 'service');

    if (customerId) {
      queryBuilder.andWhere('appointment.customerId = :customerId', {
        customerId,
      });
    }

    if (barberId) {
      queryBuilder.andWhere('appointment.barberId = :barberId', { barberId });
    }

    if (serviceId) {
      queryBuilder.andWhere('appointment.serviceId = :serviceId', {
        serviceId,
      });
    }

    if (appointmentDate) {
      queryBuilder.andWhere('appointment.appointmentDate = :appointmentDate', {
        appointmentDate,
      });
    }

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('appointment.appointmentDate', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    await this.validateCustomer(dto.customerId);
    await this.validateBarber(dto.barberId);
    await this.validateService(dto.serviceId);
    this.validateTimeRange(dto.startTime, dto.endTime);
    await this.checkConflict(
      dto.barberId,
      dto.appointmentDate,
      dto.startTime,
      dto.endTime,
    );

    const appointment = this.appointmentsRepository.create({
      customerId: dto.customerId,
      barberId: dto.barberId,
      serviceId: dto.serviceId,
      appointmentDate: dto.appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status ?? 'scheduled',
      notes: dto.notes ?? null,
    });

    const saved = await this.appointmentsRepository.save(appointment);

    // Emit appointment created event
    void this.eventEmitter.emit(EVENT_APPOINTMENT_CREATED, {
      appointmentId: saved.id,
      customerId: saved.customerId,
      barberId: saved.barberId,
      serviceId: saved.serviceId,
      appointmentDate: saved.appointmentDate,
      startTime: saved.startTime,
      endTime: saved.endTime,
      status: saved.status,
      notes: saved.notes,
    });

    return saved;
  }

  private async validateCustomer(id: string): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    if (!customer.isActive) {
      throw new ConflictException('Customer is inactive.');
    }
  }

  private async validateBarber(id: string): Promise<void> {
    const barber = await this.barbersRepository.findOne({
      where: { id },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found.');
    }

    if (!barber.isActive) {
      throw new ConflictException('Barber is inactive.');
    }
  }

  private async validateService(id: string): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    if (!service.isActive) {
      throw new ConflictException('Service is inactive.');
    }
  }

  private async checkConflict(
    barberId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.barberId = :barberId', { barberId })
      .andWhere('appointment.appointmentDate = :appointmentDate', {
        appointmentDate,
      })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: 'cancelled',
      })
      .andWhere(
        'appointment.startTime < :endTime AND appointment.endTime > :startTime',
        {
          startTime,
          endTime,
        },
      );

    if (excludeId) {
      queryBuilder.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const conflict = await queryBuilder.getOne();

    if (conflict) {
      throw new ConflictException(
        'Appointment overlaps with another appointment for this barber.',
      );
    }
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    if (endTime <= startTime) {
      throw new ConflictException('End time must be later than start time.');
    }
  }
}