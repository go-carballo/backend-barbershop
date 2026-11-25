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
      fromDate,
      toDate,
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

    if (fromDate) {
      queryBuilder.andWhere('appointment.appointmentDate >= :fromDate', {
        fromDate,
      });
    }

    if (toDate) {
      queryBuilder.andWhere('appointment.appointmentDate <= :toDate', {
        toDate,
      });
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

  /**
   * Dashboard stats: today's appointments, upcoming (this week), estimated revenue
   * from completed appointments, and breakdowns by status and service.
   * Accepts optional barberId to filter by barber's own appointments.
   */
  async getDashboardStats(barberId?: string): Promise<{
    todayAppointments: number;
    upcomingAppointments: number;
    estimatedRevenue: number;
    statusCounts: { status: string; total: number }[];
    serviceBreakdown: { serviceName: string; total: number; revenue: number }[];
  }> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Start of current week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const qb = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .leftJoinAndSelect('appointment.barber', 'barber');

    // Filter by barberId if provided (barber sees only their own appointments)
    if (barberId) {
      qb.andWhere('appointment.barberId = :barberId', { barberId });
    }

    // --- Today's appointments count ---
    const todayQb = this.appointmentsRepository.createQueryBuilder('t')
      .leftJoinAndSelect('t.service', 's')
      .leftJoinAndSelect('t.customer', 'c')
      .leftJoinAndSelect('t.barber', 'b')
      .where('t.appointmentDate = :today', { today });
    if (barberId) {
      todayQb.andWhere('t.barberId = :barberId', { barberId });
    }
    const todayAppointments = await todayQb.getCount();

    // --- Upcoming appointments (from today inclusive to end of week) ---
    const upcomingQb = this.appointmentsRepository.createQueryBuilder('u')
      .leftJoinAndSelect('u.service', 's')
      .leftJoinAndSelect('u.customer', 'c')
      .leftJoinAndSelect('u.barber', 'b')
      .where('u.appointmentDate >= :today', { today })
      .andWhere('u.appointmentDate < :endOfWeek', { endOfWeek: endOfWeek.toISOString().slice(0, 10) });
    if (barberId) {
      upcomingQb.andWhere('u.barberId = :barberId', { barberId });
    }
    const upcomingAppointments = await upcomingQb.getCount();

    // --- Estimated revenue from completed appointments ---
    const revenueQb = this.appointmentsRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.service', 's')
      .leftJoinAndSelect('r.customer', 'c')
      .leftJoinAndSelect('r.barber', 'b')
      .where('r.status = :status', { status: 'completed' });
    if (barberId) {
      revenueQb.andWhere('r.barberId = :barberId', { barberId });
    }
    const completed = await revenueQb.getMany();
    const estimatedRevenue = completed.reduce<number>((sum, a) => {
      return sum + (a.service?.price ?? 0);
    }, 0);

    // --- Status counts ---
    const statusCountsQb = this.appointmentsRepository.createQueryBuilder('sc')
      .leftJoinAndSelect('sc.service', 's')
      .leftJoinAndSelect('sc.customer', 'c')
      .leftJoinAndSelect('sc.barber', 'b')
      .select(['sc.status', 'COUNT(sc.id)'])
      .addSelect('COUNT(sc.id)', 'total')
      .groupBy('sc.status');
    if (barberId) {
      statusCountsQb.andWhere('sc.barberId = :barberId', { barberId });
    }
    const statusRows = await statusCountsQb.getRawMany();
    const statusCounts = statusRows.map((row) => ({
      status: row.sc_status,
      total: parseInt(row.COUNT_sc_id, 10),
    }));

    // --- Service breakdown with revenue ---
    const serviceQb = this.appointmentsRepository.createQueryBuilder('sv')
      .leftJoinAndSelect('sv.service', 's')
      .leftJoinAndSelect('sv.customer', 'c')
      .leftJoinAndSelect('sv.barber', 'b')
      .addSelect('COUNT(sv.id)', 'total')
      .addSelect('SUM(s.price)', 'revenue')
      .groupBy('s.name')
      .orderBy('revenue', 'DESC');
    if (barberId) {
      serviceQb.andWhere('sv.barberId = :barberId', { barberId });
    }
    const serviceRows = await serviceQb.getRawMany();
    const serviceBreakdown = serviceRows.map((row) => ({
      serviceName: row.sv_name,
      total: parseInt(row.total, 10),
      revenue: parseFloat(row.revenue) || 0,
    }));

    return {
      todayAppointments,
      upcomingAppointments,
      estimatedRevenue,
      statusCounts,
      serviceBreakdown,
    };
  }
}