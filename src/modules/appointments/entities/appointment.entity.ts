import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { Service } from '../../services/entities/service.entity';

const dateTransformer = {
  from: (value: string | Date): string => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  },
  to: (value: string | Date): string => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  },
};

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'barber_id', type: 'uuid' })
  barberId: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @Column({
    name: 'appointment_date',
    type: 'date',
    transformer: dateTransformer,
  })
  appointmentDate: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Barber, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'barber_id' })
  barber: Barber;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
