import { DISTRICTS } from '../constants/districts';
import { SERVICE_TYPES } from '../constants/services';
import type { PickupRequest } from '../schemas/pickup.schema';
import {
  operationalReportSchema,
  reportPeriodSchema,
  type OperationalReport,
  type ReportPeriod,
} from '../schemas/report.schema';
import { getOperationalDate } from './date';

const DAY_MS = 86_400_000;

function datesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const end = Date.parse(`${endDate}T00:00:00Z`);

  for (
    let current = Date.parse(`${startDate}T00:00:00Z`);
    current <= end;
    current += DAY_MS
  ) {
    dates.push(new Date(current).toISOString().slice(0, 10));
  }
  return dates;
}

function isDateInPeriod(
  value: string | undefined,
  period: ReportPeriod,
): boolean {
  return Boolean(
    value && value >= period.startDate && value <= period.endDate,
  );
}

function timestampDate(value: string): string;
function timestampDate(value: undefined): undefined;
function timestampDate(value: string | undefined): string | undefined;
function timestampDate(value: string | undefined): string | undefined {
  return value ? getOperationalDate(new Date(value)) : undefined;
}

function isTimestampInPeriod(
  value: string | undefined,
  period: ReportPeriod,
): boolean {
  return isDateInPeriod(timestampDate(value), period);
}

export function buildOperationalReport(
  tickets: PickupRequest[],
  rawPeriod: ReportPeriod,
): OperationalReport {
  const period = reportPeriodSchema.parse(rawPeriod);
  const uniqueTickets = [
    ...new Map(tickets.map((ticket) => [ticket.id, ticket])).values(),
  ];
  const created = uniqueTickets.filter((ticket) =>
    isTimestampInPeriod(ticket.createdAt, period),
  );
  const scheduled = uniqueTickets.filter((ticket) =>
    isDateInPeriod(ticket.scheduledDate, period),
  );
  const completed = uniqueTickets.filter(
    (ticket) =>
      ticket.status === 'COMPLETED' &&
      isTimestampInPeriod(ticket.completedAt, period),
  );
  const completedScheduled = scheduled.filter(
    (ticket) => ticket.status === 'COMPLETED',
  );
  const extraTrip = uniqueTickets.filter(
    (ticket) =>
      ticket.status === 'EXTRA_TRIP_REQUIRED' &&
      isTimestampInPeriod(ticket.updatedAt, period),
  );
  const cancelled = uniqueTickets.filter(
    (ticket) =>
      ['CANCELLED', 'REJECTED'].includes(ticket.status) &&
      isTimestampInPeriod(ticket.updatedAt, period),
  );
  const relevant = uniqueTickets.filter(
    (ticket) =>
      isTimestampInPeriod(ticket.createdAt, period) ||
      isDateInPeriod(ticket.scheduledDate, period) ||
      isTimestampInPeriod(ticket.completedAt, period) ||
      isTimestampInPeriod(ticket.updatedAt, period),
  );

  const byDistrict = Object.fromEntries(
    DISTRICTS.map((district) => [
      district,
      created.filter((ticket) => ticket.district === district).length,
    ]),
  ) as OperationalReport['byDistrict'];
  const byServiceType = Object.fromEntries(
    SERVICE_TYPES.map((serviceType) => [
      serviceType,
      created.filter((ticket) => ticket.serviceType === serviceType).length,
    ]),
  ) as OperationalReport['byServiceType'];

  return operationalReportSchema.parse({
    period,
    totals: {
      created: created.length,
      scheduled: scheduled.length,
      completed: completed.length,
      extraTrip: extraTrip.length,
      cancelled: cancelled.length,
      completionRate:
        scheduled.length === 0
          ? 0
          : Math.round(
              (completedScheduled.length / scheduled.length) * 10_000,
            ) / 100,
    },
    byDistrict,
    byServiceType,
    daily: datesBetween(period.startDate, period.endDate).map((date) => ({
      date,
      created: created.filter(
        (ticket) => timestampDate(ticket.createdAt) === date,
      ).length,
      scheduled: scheduled.filter(
        (ticket) => ticket.scheduledDate === date,
      ).length,
      completed: completed.filter(
        (ticket) => timestampDate(ticket.completedAt) === date,
      ).length,
      extraTrip: extraTrip.filter(
        (ticket) => timestampDate(ticket.updatedAt) === date,
      ).length,
    })),
    rows: relevant
      .map((ticket) => ({
        ticketCode: ticket.ticketCode,
        createdDate: timestampDate(ticket.createdAt),
        scheduledDate: ticket.scheduledDate,
        completedDate: timestampDate(ticket.completedAt),
        district: ticket.district,
        serviceType: ticket.serviceType,
        status: ticket.status,
        driverName: ticket.assignedDriverName,
      }))
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate)),
  });
}
