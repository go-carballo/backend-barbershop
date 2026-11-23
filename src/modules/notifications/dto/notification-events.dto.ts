export interface AppointmentCreatedEvent {
  appointmentId: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  serviceName?: string;
}

export interface AppointmentStatusChangedEvent {
  appointmentId: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  fromStatus: string;
  toStatus: string;
  serviceName?: string;
}