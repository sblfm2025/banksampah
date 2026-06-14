import type { District } from '../../shared/constants/districts';
import type { PickupStatus } from '../../shared/constants/statuses';
import type {
  AssignDriverInput,
  CreateManualPickupInput,
  SchedulePickupInput,
  UpdatePickupStatusInput,
  UpdatePickupImpactInput,
} from '../../shared/schemas/pickup-input.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import type {
  OperationalReport,
  ReportPeriod,
} from '../../shared/schemas/report.schema';

export interface TicketFilters {
  status?: PickupStatus;
  district?: District;
  villageId?: string;
  serviceType?: PickupRequest['serviceType'];
  volumeLevel?: PickupRequest['volumeLevel'];
  query?: string;
  scheduledDate?: string;
  assignedDriverId?: string;
}

export interface DashboardSummary {
  newToday: number;
  needsInfo: number;
  needsReview: number;
  scheduledToday: number;
  completedToday: number;
  extraTrip: number;
  watangSawitto: number;
  paleteang: number;
}

export interface DriverOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface OperatorRepository {
  getSummary(): Promise<DashboardSummary>;
  getOperationalReport(period: ReportPeriod): Promise<OperationalReport>;
  listTickets(filters?: TicketFilters): Promise<PickupRequest[]>;
  getTicket(id: string): Promise<PickupRequest>;
  createManual(input: CreateManualPickupInput): Promise<PickupRequest>;
  updateStatus(
    id: string,
    input: UpdatePickupStatusInput,
  ): Promise<PickupRequest>;
  updateImpact(
    id: string,
    input: UpdatePickupImpactInput,
  ): Promise<PickupRequest>;
  schedule(id: string, input: SchedulePickupInput): Promise<PickupRequest>;
  assignDriver(
    id: string,
    input: AssignDriverInput,
  ): Promise<PickupRequest>;
  listDrivers(): Promise<DriverOption[]>;
}
