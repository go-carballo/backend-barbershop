import { ApiProperty } from '@nestjs/swagger';

export interface ServiceBreakdown {
  serviceName: string;
  total: number;
  revenue: number;
}

export interface StatusCount {
  status: string;
  total: number;
}

export class DashboardStatsResponse {
  @ApiProperty({ example: 3 })
  todayAppointments: number;

  @ApiProperty({ example: 5 })
  upcomingAppointments: number;

  @ApiProperty({ example: 12450 })
  estimatedRevenue: number;

  @ApiProperty({ example: [
    { status: 'scheduled', total: 3 },
    { status: 'confirmed', total: 2 },
    { status: 'completed', total: 5 },
  ]})
  statusCounts: StatusCount[];

  @ApiProperty({ example: [
    { serviceName: 'Corte de cabello', total: 8, revenue: 36000 },
    { serviceName: 'Barba y bigote', total: 3, revenue: 9000 },
  ]})
  serviceBreakdown: ServiceBreakdown[];
}