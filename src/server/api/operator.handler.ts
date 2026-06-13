import type { AuditActor } from '../../shared/schemas/audit.schema';
import type { District } from '../../shared/constants/districts';
import type { PickupStatus } from '../../shared/constants/statuses';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import {
  assignDriverInputSchema,
  schedulePickupInputSchema,
  updatePickupStatusInputSchema,
} from '../../shared/schemas/pickup-input.schema';
import { PickupTicketService } from '../services/pickup-ticket.service';
import { ReportService } from '../services/report.service';
import { ServiceError } from '../services/service-errors';
import { UserService } from '../services/user.service';

export interface OperatorRequestContext {
  actor: AuditActor;
}

export interface ApiResult {
  status: number;
  body: unknown;
}

export class OperatorApiHandler {
  constructor(
    private readonly tickets = new PickupTicketService(),
    private readonly reports = new ReportService(),
    private readonly users = new UserService(),
  ) {}

  async listTickets(query: Record<string, string | undefined>): Promise<ApiResult> {
    return this.wrap(() =>
      this.tickets.list({
        status: query.status as PickupStatus | undefined,
        district: query.district as District | undefined,
        serviceType: query.serviceType as PickupRequest['serviceType'] | undefined,
        volumeLevel: query.volumeLevel as
          | PickupRequest['volumeLevel']
          | undefined,
        date: query.date,
        query: query.q,
      }),
    );
  }

  async getTicket(id: string): Promise<ApiResult> {
    return this.wrap(() => this.tickets.getById(id));
  }

  async updateStatus(
    id: string,
    body: unknown,
    context: OperatorRequestContext,
  ): Promise<ApiResult> {
    return this.wrap(() =>
      this.tickets.updateStatus(
        id,
        updatePickupStatusInputSchema.parse(body),
        context.actor,
      ),
    );
  }

  async schedule(
    id: string,
    body: unknown,
    context: OperatorRequestContext,
  ): Promise<ApiResult> {
    return this.wrap(() =>
      this.tickets.schedule(
        id,
        schedulePickupInputSchema.parse(body),
        context.actor,
      ),
    );
  }

  async assignDriver(
    id: string,
    body: unknown,
    context: OperatorRequestContext,
  ): Promise<ApiResult> {
    return this.wrap(() =>
      this.tickets.assignDriver(
        id,
        assignDriverInputSchema.parse(body),
        context.actor,
      ),
    );
  }

  async summary(): Promise<ApiResult> {
    return this.wrap(() => this.reports.getOperationalSummary());
  }

  async operationalReport(
    query: Record<string, string | undefined>,
  ): Promise<ApiResult> {
    return this.wrap(() =>
      this.reports.getOperationalReport({
        startDate: query.startDate ?? '',
        endDate: query.endDate ?? '',
      }),
    );
  }

  async listDrivers(): Promise<ApiResult> {
    return this.wrap(() => this.users.listActiveDrivers());
  }

  private async wrap(action: () => Promise<unknown>): Promise<ApiResult> {
    try {
      return { status: 200, body: await action() };
    } catch (error) {
      if (error instanceof ServiceError) {
        const status =
          error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'CONFLICT' ||
                error.code === 'INVALID_STATUS_TRANSITION'
              ? 409
              : 400;
        return {
          status,
          body: { success: false, error: { code: error.code, message: error.message } },
        };
      }

      return {
        status: 400,
        body: {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid.' },
        },
      };
    }
  }
}
