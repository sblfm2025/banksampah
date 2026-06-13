import {
  completePickupInputSchema,
  mapActualTripResultToStatus,
  type CompletePickupInput,
} from '../../shared/schemas/pickup-proof.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import { DEMO_TICKETS } from '../admin/demo-data';
import type {
  DriverRepository,
  ProofKind,
} from './driver.types';
import { uploadProofMediaToFirestore } from './firestore-proof-media';
import { createApiHeaders } from '../../client/api-headers';
import { parsePickupSnapshot } from '../../client/firestore-pickup';
import { getOperationalDate } from '../../shared/utils/date';
import { buildPickupAudit } from '../../client/firestore-audit';

const proofMediaProvider =
  import.meta.env.VITE_PROOF_MEDIA_PROVIDER || 'disabled';
export const proofStorageEnabled =
  import.meta.env.VITE_USE_DEMO_DATA !== 'false' ||
  proofMediaProvider === 'firestore' ||
  proofMediaProvider === 'firebase-storage';

export class ProofStorageUnavailableError extends Error {
  constructor() {
    super(
      'Upload bukti belum tersedia karena media storage belum dikonfigurasi.',
    );
    this.name = 'ProofStorageUnavailableError';
  }
}

export class DemoDriverRepository implements DriverRepository {
  private tickets = structuredClone(DEMO_TICKETS);

  async listToday(driverId: string) {
    return this.tickets.filter(
      (ticket) =>
        ticket.assignedDriverId === driverId &&
        ['ASSIGNED', 'IN_PROGRESS', 'EXTRA_TRIP_REQUIRED'].includes(
          ticket.status,
        ),
    );
  }

  async getPickup(id: string, driverId: string) {
    const ticket = this.tickets.find(
      (item) => item.id === id && item.assignedDriverId === driverId,
    );
    if (!ticket) throw new Error('Pickup tidak ditemukan.');
    return structuredClone(ticket);
  }

  async start(id: string, driverId: string) {
    const ticket = await this.getPickup(id, driverId);
    if (ticket.status !== 'ASSIGNED') {
      throw new Error('Pickup tidak dapat dimulai.');
    }
    return this.replace(id, {
      ...ticket,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async uploadProof(
    driverId: string,
    ticketId: string,
    kind: ProofKind,
    files: File[],
  ) {
    return files.map(
      (file, index) =>
        `https://demo.sampahta.local/pickup-proofs/${driverId}/${ticketId}/${kind}/${index}-${encodeURIComponent(file.name)}`,
    );
  }

  async complete(
    id: string,
    driverId: string,
    rawInput: CompletePickupInput,
  ) {
    const input = completePickupInputSchema.parse(rawInput);
    const ticket = await this.getPickup(id, driverId);
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(ticket.status)) {
      throw new Error('Pickup tidak dapat diselesaikan.');
    }
    const status = mapActualTripResultToStatus(input.actualTripResult);

    return this.replace(id, {
      ...ticket,
      status,
      driverNotes: input.driverNotes,
      completedAt:
        status === 'COMPLETED' ? new Date().toISOString() : undefined,
      cancelledAt:
        status === 'CANCELLED' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  private replace(id: string, ticket: PickupRequest) {
    this.tickets = this.tickets.map((item) => (item.id === id ? ticket : item));
    return structuredClone(ticket);
  }
}

export class ApiDriverRepository implements DriverRepository {
  constructor(private readonly baseUrl: string) {}

  listToday() {
    return this.request<PickupRequest[]>('/api/driver/pickups/today');
  }

  getPickup(id: string) {
    return this.request<PickupRequest>(`/api/driver/pickups/${id}`);
  }

  start(id: string) {
    return this.request<PickupRequest>(
      `/api/driver/pickups/${id}/start`,
      'POST',
    );
  }

  async uploadProof(
    driverId: string,
    ticketId: string,
    kind: ProofKind,
    files: File[],
  ) {
    if (!proofStorageEnabled) {
      throw new ProofStorageUnavailableError();
    }

    if (proofMediaProvider === 'firestore') {
      return uploadProofMediaToFirestore(driverId, ticketId, kind, files);
    }

    const [{ ref, uploadBytes, getDownloadURL }, { storage }] =
      await Promise.all([
        import('firebase/storage'),
        import('../../client/firebase-storage'),
      ]);

    return Promise.all(
      files.map(async (file, index) => {
        const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
        const path = `pickup-proofs/${driverId}/${ticketId}/${kind}/${Date.now()}-${index}-${safeName}`;
        const snapshot = await uploadBytes(ref(storage, path), file, {
          contentType: file.type,
          customMetadata: { ticketId, kind },
        });
        return getDownloadURL(snapshot.ref);
      }),
    );
  }

  complete(id: string, _driverId: string, input: CompletePickupInput) {
    return this.request<PickupRequest>(
      `/api/driver/pickups/${id}/complete`,
      'POST',
      input,
    );
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
    if (!response.ok) throw new Error(`Permintaan gagal (${response.status}).`);
    return response.json() as Promise<T>;
  }
}

export class FirestoreDriverRepository implements DriverRepository {
  async listToday(driverId: string) {
    const [{ collection, getDocs, query, where }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const snapshot = await getDocs(
      query(
        collection(db, 'pickupRequests'),
        where('scheduledDate', '==', getOperationalDate()),
        where('assignedDriverId', '==', driverId),
      ),
    );
    return snapshot.docs
      .map(parsePickupSnapshot)
      .filter((ticket) =>
        ['ASSIGNED', 'IN_PROGRESS', 'EXTRA_TRIP_REQUIRED'].includes(
          ticket.status,
        ),
      );
  }

  async getPickup(id: string, driverId: string) {
    const [{ doc, getDoc }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const ticket = parsePickupSnapshot(
      await getDoc(doc(db, 'pickupRequests', id)),
    );
    if (ticket.assignedDriverId !== driverId) {
      throw new Error('Pickup tidak ditemukan.');
    }
    return ticket;
  }

  async start(id: string, driverId: string) {
    const current = await this.getPickup(id, driverId);
    if (current.status !== 'ASSIGNED') {
      throw new Error('Pickup tidak dapat dimulai.');
    }
    const [
      { collection, doc, serverTimestamp, writeBatch },
      { db },
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const timestamp = serverTimestamp();
    const auditReference = doc(collection(db, 'auditLogs'));
    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests', id), {
      status: 'IN_PROGRESS',
      startedAt: timestamp,
      updatedAt: timestamp,
      lastAuditId: auditReference.id,
    });
    batch.set(
      auditReference,
      buildPickupAudit(
        { id: driverId, role: 'DRIVER' },
        'PICKUP_STARTED',
        id,
        { status: current.status },
        { status: 'IN_PROGRESS' },
        timestamp,
      ),
    );
    await batch.commit();
    return this.getPickup(id, driverId);
  }

  uploadProof(
    driverId: string,
    ticketId: string,
    kind: ProofKind,
    files: File[],
  ) {
    return uploadProofMediaToFirestore(driverId, ticketId, kind, files);
  }

  async complete(
    id: string,
    driverId: string,
    rawInput: CompletePickupInput,
  ) {
    const input = completePickupInputSchema.parse(rawInput);
    const current = await this.getPickup(id, driverId);
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(current.status)) {
      throw new Error('Pickup tidak dapat diselesaikan.');
    }
    const [
      { collection, doc, serverTimestamp, writeBatch },
      { db },
    ] = await Promise.all([
      import('firebase/firestore'),
      import('../../client/firebase'),
    ]);
    const status = mapActualTripResultToStatus(input.actualTripResult);
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    const auditReference = doc(collection(db, 'auditLogs'));
    batch.set(doc(db, 'pickupProofs', id), {
      pickupRequestId: id,
      driverId,
      beforePhotoUrls: input.beforePhotoUrls,
      afterPhotoUrls: input.afterPhotoUrls,
      actualTripResult: input.actualTripResult,
      driverNotes: input.driverNotes ?? null,
      createdAt: timestamp,
    });
    const ticketUpdate: Record<string, unknown> = {
      status,
      updatedAt: timestamp,
      lastAuditId: auditReference.id,
    };
    if (input.driverNotes) ticketUpdate.driverNotes = input.driverNotes;
    if (status === 'COMPLETED') ticketUpdate.completedAt = timestamp;
    if (status === 'CANCELLED') ticketUpdate.cancelledAt = timestamp;
    batch.update(doc(db, 'pickupRequests', id), ticketUpdate);
    batch.set(
      auditReference,
      buildPickupAudit(
        { id: driverId, role: 'DRIVER' },
        'PICKUP_RESULT_RECORDED',
        id,
        { status: current.status },
        {
          status,
          actualTripResult: input.actualTripResult,
        },
        timestamp,
      ),
    );
    await batch.commit();
    return this.getPickup(id, driverId);
  }
}

const productionDataProvider =
  import.meta.env.VITE_DATA_PROVIDER || 'firestore';
export const driverRepository: DriverRepository =
  import.meta.env.VITE_USE_DEMO_DATA !== 'false'
    ? new DemoDriverRepository()
    : productionDataProvider === 'firestore'
      ? new FirestoreDriverRepository()
    : new ApiDriverRepository(
        import.meta.env.VITE_API_URL || 'http://localhost:3000',
      );
