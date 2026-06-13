import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  reportPeriodSchema,
  type OperationalReport,
  type ReportPeriod,
} from '../../shared/schemas/report.schema';
import { getOperationalDate } from '../../shared/utils/date';
import { buildOperationalReport } from '../../shared/utils/reporting';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { pickupRequestConverter } from '../firebase/converters';

export interface OperationalSummary {
  newToday: number;
  needsInfo: number;
  needsReview: number;
  scheduledToday: number;
  completedToday: number;
  extraTrip: number;
  watangSawitto: number;
  paleteang: number;
}

export class ReportService {
  constructor(private readonly db: Firestore = adminDb) {}

  async getOperationalSummary(now = new Date()): Promise<OperationalSummary> {
    const today = getOperationalDate(now);
    const report = await this.getOperationalReport({
      startDate: today,
      endDate: today,
    });
    const tickets = await this.getCurrentActionTickets();

    return {
      newToday: report.totals.created,
      needsInfo: tickets.filter((ticket) => ticket.status === 'NEEDS_INFO')
        .length,
      needsReview: tickets.filter(
        (ticket) => ticket.status === 'NEEDS_OPERATOR_REVIEW',
      ).length,
      scheduledToday: report.totals.scheduled,
      completedToday: report.totals.completed,
      extraTrip: tickets.filter(
        (ticket) => ticket.status === 'EXTRA_TRIP_REQUIRED',
      ).length,
      watangSawitto: tickets.filter(
        (ticket) => ticket.district === 'WATANG_SAWITTO',
      ).length,
      paleteang: tickets.filter(
        (ticket) => ticket.district === 'PALETEANG',
      ).length,
    };
  }

  async getOperationalReport(
    rawPeriod: ReportPeriod,
  ): Promise<OperationalReport> {
    const period = reportPeriodSchema.parse(rawPeriod);
    const start = Timestamp.fromDate(
      new Date(`${period.startDate}T00:00:00+08:00`),
    );
    const endDate = new Date(`${period.endDate}T00:00:00+08:00`);
    endDate.setDate(endDate.getDate() + 1);
    const end = Timestamp.fromDate(endDate);
    const collection = this.db
      .collection(COLLECTIONS.pickupRequests)
      .withConverter(pickupRequestConverter);

    const [created, scheduled, completed, updated] = await Promise.all([
      collection
        .where('createdAt', '>=', start)
        .where('createdAt', '<', end)
        .limit(1000)
        .get(),
      collection
        .where('scheduledDate', '>=', period.startDate)
        .where('scheduledDate', '<=', period.endDate)
        .limit(1000)
        .get(),
      collection
        .where('completedAt', '>=', start)
        .where('completedAt', '<', end)
        .limit(1000)
        .get(),
      collection
        .where('updatedAt', '>=', start)
        .where('updatedAt', '<', end)
        .limit(1000)
        .get(),
    ]);

    return buildOperationalReport(
      [...created.docs, ...scheduled.docs, ...completed.docs, ...updated.docs].map(
        (document) => document.data(),
      ),
      period,
    );
  }

  private async getCurrentActionTickets() {
    const snapshot = await this.db
      .collection(COLLECTIONS.pickupRequests)
      .withConverter(pickupRequestConverter)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    return snapshot.docs.map((document) => document.data());
  }
}
