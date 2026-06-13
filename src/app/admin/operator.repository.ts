import { canTransitionPickupStatus } from '../../shared/constants/statuses';
import {
  assignDriverInputSchema,
  schedulePickupInputSchema,
  updatePickupStatusInputSchema,
} from '../../shared/schemas/pickup-input.schema';
import {
  pickupRequestSchema,
  type PickupRequest,
} from '../../shared/schemas/pickup.schema';
import { DEMO_TICKETS } from './demo-data';
import type {
  DashboardSummary,
  DriverOption,
  OperatorRepository,
  TicketFilters,
} from './operator.types';
import type { ReportPeriod } from '../../shared/schemas/report.schema';
import { buildOperationalReport } from '../../shared/utils/reporting';
import { createApiHeaders } from '../../client/api-headers';
import { parsePickupSnapshot } from '../../client/firestore-pickup';
import {
  buildPickupAudit,
  getCurrentAuditActor,
} from '../../client/firestore-audit';
import {
  getOperationalDate,
  getOperationalUtcRange,
} from '../../shared/utils/date';

function filterTickets(
  tickets: PickupRequest[],
  filters: TicketFilters = {},
): PickupRequest[] {
  const query = filters.query?.trim().toLocaleLowerCase('id-ID');

  return tickets
    .filter((ticket) => !filters.status || ticket.status === filters.status)
    .filter(
      (ticket) => !filters.district || ticket.district === filters.district,
    )
    .filter(
      (ticket) => !filters.villageId || ticket.villageId === filters.villageId,
    )
    .filter(
      (ticket) =>
        !filters.serviceType || ticket.serviceType === filters.serviceType,
    )
    .filter(
      (ticket) =>
        !filters.volumeLevel || ticket.volumeLevel === filters.volumeLevel,
    )
    .filter(
      (ticket) =>
        !filters.scheduledDate ||
        ticket.scheduledDate === filters.scheduledDate,
    )
    .filter((ticket) => {
      if (!query) return true;
      return [
        ticket.ticketCode,
        ticket.customerName,
        ticket.customerPhoneNumber,
        ticket.addressText,
        ticket.villageId,
      ]
        .filter(Boolean)
        .some((value) =>
          value!.toLocaleLowerCase('id-ID').includes(query),
        );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function summarize(tickets: PickupRequest[]): DashboardSummary {
  const today = getOperationalDate();
  return {
    newToday: tickets.filter(
      (ticket) =>
        ticket.status === 'NEW' &&
        getOperationalDate(new Date(ticket.createdAt)) === today,
    ).length,
    needsInfo: tickets.filter((ticket) => ticket.status === 'NEEDS_INFO').length,
    needsReview: tickets.filter(
      (ticket) => ticket.status === 'NEEDS_OPERATOR_REVIEW',
    ).length,
    scheduledToday: tickets.filter(
      (ticket) => ticket.scheduledDate === today,
    ).length,
    completedToday: tickets.filter(
      (ticket) =>
        ticket.status === 'COMPLETED' &&
        ticket.completedAt &&
        getOperationalDate(new Date(ticket.completedAt)) === today,
    ).length,
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

export class DemoOperatorRepository implements OperatorRepository {
  private tickets = structuredClone(DEMO_TICKETS);

  async getSummary() {
    return summarize(this.tickets);
  }

  async getOperationalReport(period: ReportPeriod) {
    return buildOperationalReport(this.tickets, period);
  }

  async listTickets(filters?: TicketFilters) {
    return structuredClone(filterTickets(this.tickets, filters));
  }

  async getTicket(id: string) {
    const ticket = this.tickets.find((item) => item.id === id);
    if (!ticket) throw new Error('Tiket tidak ditemukan.');
    return structuredClone(ticket);
  }

  async updateStatus(
    id: string,
    rawInput: Parameters<OperatorRepository['updateStatus']>[1],
  ) {
    const input = updatePickupStatusInputSchema.parse(rawInput);
    const ticket = await this.getTicket(id);
    if (!canTransitionPickupStatus(ticket.status, input.status)) {
      throw new Error('Transisi status tidak diizinkan.');
    }
    if (input.status === 'REJECTED' && !input.rejectedReason) {
      throw new Error('Alasan penolakan wajib diisi.');
    }

    return this.replace(id, {
      ...ticket,
      status: input.status,
      operatorNotes: input.notes ?? ticket.operatorNotes,
      rejectedReason: input.rejectedReason,
      updatedAt: new Date().toISOString(),
    });
  }

  async schedule(
    id: string,
    rawInput: Parameters<OperatorRepository['schedule']>[1],
  ) {
    const input = schedulePickupInputSchema.parse(rawInput);
    const ticket = await this.getTicket(id);
    if (ticket.status !== 'CONFIRMED') {
      throw new Error('Tiket harus dikonfirmasi sebelum dijadwalkan.');
    }

    return this.replace(id, {
      ...ticket,
      ...input,
      status: 'SCHEDULED',
      updatedAt: new Date().toISOString(),
    });
  }

  async assignDriver(
    id: string,
    rawInput: Parameters<OperatorRepository['assignDriver']>[1],
  ) {
    const input = assignDriverInputSchema.parse(rawInput);
    const ticket = await this.getTicket(id);
    if (ticket.status !== 'SCHEDULED') {
      throw new Error('Tiket harus dijadwalkan sebelum petugas ditugaskan.');
    }

    return this.replace(id, {
      ...ticket,
      status: 'ASSIGNED',
      assignedDriverId: input.driverId,
      assignedDriverName: input.driverName,
      updatedAt: new Date().toISOString(),
    });
  }

  async listDrivers(): Promise<DriverOption[]> {
    return [
      { id: 'driver-1', name: 'Pak Amir', isActive: true },
      { id: 'driver-2', name: 'Pak Fajar', isActive: true },
    ];
  }

  private replace(id: string, ticket: PickupRequest): PickupRequest {
    const parsed = pickupRequestSchema.parse(ticket);
    this.tickets = this.tickets.map((item) => (item.id === id ? parsed : item));
    return structuredClone(parsed);
  }
}

export class ApiOperatorRepository implements OperatorRepository {
  constructor(private readonly baseUrl: string) {}

  async getSummary() {
    return this.request<DashboardSummary>('/api/reports/summary');
  }

  async getOperationalReport(period: ReportPeriod) {
    const params = new URLSearchParams(period);
    return this.request<ReturnType<OperatorRepository['getOperationalReport']> extends Promise<infer T> ? T : never>(
      `/api/reports/operational?${params}`,
    );
  }

  async listTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key === 'query' ? 'q' : key, value);
    });
    const suffix = params.size > 0 ? `?${params}` : '';
    return this.request<PickupRequest[]>(`/api/pickup-requests${suffix}`);
  }

  async getTicket(id: string) {
    return this.request<PickupRequest>(`/api/pickup-requests/${id}`);
  }

  async updateStatus(
    id: string,
    input: Parameters<OperatorRepository['updateStatus']>[1],
  ) {
    return this.request<PickupRequest>(
      `/api/pickup-requests/${id}/status`,
      'PATCH',
      input,
    );
  }

  async schedule(
    id: string,
    input: Parameters<OperatorRepository['schedule']>[1],
  ) {
    return this.request<PickupRequest>(
      `/api/pickup-requests/${id}/schedule`,
      'PATCH',
      input,
    );
  }

  async assignDriver(
    id: string,
    input: Parameters<OperatorRepository['assignDriver']>[1],
  ) {
    return this.request<PickupRequest>(
      `/api/pickup-requests/${id}/assign-driver`,
      'PATCH',
      input,
    );
  }

  async listDrivers() {
    return this.request<DriverOption[]>('/api/drivers?active=true');
  }

  private async request<T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: await createApiHeaders(Boolean(body)),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Permintaan gagal (${response.status}).`);
    }
    return response.json() as Promise<T>;
  }
}

export class FirestoreOperatorRepository implements OperatorRepository {
  async getSummary() {
    const [
      {
        collection,
        getCountFromServer,
        query,
        Timestamp,
        where,
      },
      { db },
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const tickets = collection(db, 'pickupRequests');
    const today = getOperationalDate();
    const { start, end } = getOperationalUtcRange(today);
    const count = async (...constraints: Parameters<typeof query>[1][]) =>
      (
        await getCountFromServer(
          query(tickets, ...constraints),
        )
      ).data().count;
    const entries = await Promise.allSettled([
      count(
        where('status', '==', 'NEW'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<', Timestamp.fromDate(end)),
      ),
      count(where('status', '==', 'NEEDS_INFO')),
      count(where('status', '==', 'NEEDS_OPERATOR_REVIEW')),
      count(where('scheduledDate', '==', today)),
      count(
        where('status', '==', 'COMPLETED'),
        where('completedAt', '>=', Timestamp.fromDate(start)),
        where('completedAt', '<', Timestamp.fromDate(end)),
      ),
      count(where('status', '==', 'EXTRA_TRIP_REQUIRED')),
      count(where('district', '==', 'WATANG_SAWITTO')),
      count(where('district', '==', 'PALETEANG')),
    ]);
    const values = entries.map((entry) =>
      entry.status === 'fulfilled' ? entry.value : 0,
    );
    return {
      newToday: values[0],
      needsInfo: values[1],
      needsReview: values[2],
      scheduledToday: values[3],
      completedToday: values[4],
      extraTrip: values[5],
      watangSawitto: values[6],
      paleteang: values[7],
    };
  }

  async getOperationalReport(period: ReportPeriod) {
    const [
      {
        collection,
        getDocs,
        limit,
        query,
        Timestamp,
        where,
      },
      { db },
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const tickets = collection(db, 'pickupRequests');
    const { start } = getOperationalUtcRange(period.startDate);
    const { end } = getOperationalUtcRange(period.endDate);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    const snapshots = await Promise.all([
      getDocs(
        query(
          tickets,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<', endTimestamp),
          limit(1000),
        ),
      ),
      getDocs(
        query(
          tickets,
          where('scheduledDate', '>=', period.startDate),
          where('scheduledDate', '<=', period.endDate),
          limit(1000),
        ),
      ),
      getDocs(
        query(
          tickets,
          where('completedAt', '>=', startTimestamp),
          where('completedAt', '<', endTimestamp),
          limit(1000),
        ),
      ),
      getDocs(
        query(
          tickets,
          where('updatedAt', '>=', startTimestamp),
          where('updatedAt', '<', endTimestamp),
          limit(1000),
        ),
      ),
    ]);
    const unique = new Map<string, PickupRequest>();
    snapshots.forEach((snapshot) =>
      snapshot.docs.forEach((item) => {
        const ticket = parsePickupSnapshot(item);
        unique.set(ticket.id, ticket);
      }),
    );
    return buildOperationalReport([...unique.values()], period);
  }

  async listTickets(filters: TicketFilters = {}) {
    const [
      { collection, getDocs, limit, orderBy, query, where },
      { db },
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const tickets = collection(db, 'pickupRequests');
    const constraints = [];
    if (filters.scheduledDate) {
      constraints.push(where('scheduledDate', '==', filters.scheduledDate));
    } else if (filters.status) {
      constraints.push(where('status', '==', filters.status));
      constraints.push(orderBy('createdAt', 'desc'));
    } else if (filters.district) {
      constraints.push(where('district', '==', filters.district));
      constraints.push(orderBy('createdAt', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    constraints.push(limit(100));
    const snapshot = await getDocs(query(tickets, ...constraints));
    return filterTickets(snapshot.docs.map(parsePickupSnapshot), filters);
  }

  async getTicket(id: string) {
    const [{ doc, getDoc }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    return parsePickupSnapshot(await getDoc(doc(db, 'pickupRequests', id)));
  }

  async updateStatus(
    id: string,
    rawInput: Parameters<OperatorRepository['updateStatus']>[1],
  ) {
    const input = updatePickupStatusInputSchema.parse(rawInput);
    const current = await this.getTicket(id);
    if (!canTransitionPickupStatus(current.status, input.status)) {
      throw new Error('Transisi status tidak diizinkan.');
    }
    const [
      { collection, deleteField, doc, serverTimestamp, writeBatch },
      { db },
      actor,
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
      getCurrentAuditActor(['SUPER_ADMIN', 'OPERATOR']),
    ]);
    const timestamp = serverTimestamp();
    const auditReference = doc(collection(db, 'auditLogs'));
    const update: Record<string, unknown> = {
      status: input.status,
      updatedAt: timestamp,
      lastAuditId: auditReference.id,
    };
    if (input.notes) update.operatorNotes = input.notes;
    if (input.rejectedReason) update.rejectedReason = input.rejectedReason;
    if (input.status !== 'REJECTED') update.rejectedReason = deleteField();

    const after: Record<string, unknown> = { status: input.status };
    if (input.notes) after.notes = input.notes;
    if (input.rejectedReason) after.rejectedReason = input.rejectedReason;

    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests', id), update);
    batch.set(
      auditReference,
      buildPickupAudit(
        actor,
        'PICKUP_STATUS_CHANGED',
        id,
        { status: current.status },
        after,
        timestamp,
      ),
    );
    await batch.commit();
    return this.getTicket(id);
  }

  async schedule(
    id: string,
    rawInput: Parameters<OperatorRepository['schedule']>[1],
  ) {
    const input = schedulePickupInputSchema.parse(rawInput);
    const current = await this.getTicket(id);
    if (current.status !== 'CONFIRMED') {
      throw new Error('Tiket harus dikonfirmasi sebelum dijadwalkan.');
    }
    const [
      { collection, doc, serverTimestamp, writeBatch },
      { db },
      actor,
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
      getCurrentAuditActor(['SUPER_ADMIN', 'OPERATOR']),
    ]);
    const timestamp = serverTimestamp();
    const auditReference = doc(collection(db, 'auditLogs'));
    const update: Record<string, unknown> = {
      status: 'SCHEDULED',
      scheduledDate: input.scheduledDate,
      scheduledTimeWindow: input.scheduledTimeWindow,
      updatedAt: timestamp,
      lastAuditId: auditReference.id,
    };
    if (input.operatorNotes) update.operatorNotes = input.operatorNotes;
    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests', id), update);
    batch.set(
      auditReference,
      buildPickupAudit(
        actor,
        'PICKUP_SCHEDULED',
        id,
        { status: current.status },
        {
          status: 'SCHEDULED',
          scheduledDate: input.scheduledDate,
          scheduledTimeWindow: input.scheduledTimeWindow,
        },
        timestamp,
      ),
    );
    await batch.commit();
    return this.getTicket(id);
  }

  async assignDriver(
    id: string,
    rawInput: Parameters<OperatorRepository['assignDriver']>[1],
  ) {
    const input = assignDriverInputSchema.parse(rawInput);
    const current = await this.getTicket(id);
    if (current.status !== 'SCHEDULED') {
      throw new Error('Tiket harus dijadwalkan sebelum petugas ditugaskan.');
    }
    const [
      { collection, doc, serverTimestamp, writeBatch },
      { db },
      actor,
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
      getCurrentAuditActor(['SUPER_ADMIN', 'OPERATOR']),
    ]);
    const timestamp = serverTimestamp();
    const auditReference = doc(collection(db, 'auditLogs'));
    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests', id), {
      status: 'ASSIGNED',
      assignedDriverId: input.driverId,
      assignedDriverName: input.driverName,
      updatedAt: timestamp,
      lastAuditId: auditReference.id,
    });
    batch.set(
      auditReference,
      buildPickupAudit(
        actor,
        'PICKUP_DRIVER_ASSIGNED',
        id,
        { status: current.status },
        {
          status: 'ASSIGNED',
          assignedDriverId: input.driverId,
          assignedDriverName: input.driverName,
        },
        timestamp,
      ),
    );
    await batch.commit();
    return this.getTicket(id);
  }

  async listDrivers(): Promise<DriverOption[]> {
    const [{ collection, getDocs, query, where }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const snapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'DRIVER')),
    );
    return snapshot.docs.map((item) => ({
      id: item.id,
      name: String(item.data().name),
      isActive: item.data().isActive === true,
    }));
  }
}

const productionDataProvider =
  import.meta.env.VITE_DATA_PROVIDER || 'firestore';
export const operatorRepository: OperatorRepository =
  import.meta.env.VITE_USE_DEMO_DATA !== 'false'
    ? new DemoOperatorRepository()
    : productionDataProvider === 'firestore'
      ? new FirestoreOperatorRepository()
    : new ApiOperatorRepository(
        import.meta.env.VITE_API_URL || 'http://localhost:3000',
      );

export { filterTickets, summarize };
