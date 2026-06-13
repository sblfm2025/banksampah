import type { CompletePickupInput } from '../../shared/schemas/pickup-proof.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';

export type ProofKind = 'before' | 'after';

export interface DriverRepository {
  listToday(driverId: string): Promise<PickupRequest[]>;
  getPickup(id: string, driverId: string): Promise<PickupRequest>;
  start(id: string, driverId: string): Promise<PickupRequest>;
  uploadProof(
    driverId: string,
    ticketId: string,
    kind: ProofKind,
    files: File[],
  ): Promise<string[]>;
  complete(
    id: string,
    driverId: string,
    input: CompletePickupInput,
  ): Promise<PickupRequest>;
}

export interface PendingDriverCompletion {
  id: string;
  ticketId: string;
  driverId: string;
  actualTripResult: CompletePickupInput['actualTripResult'];
  driverNotes?: string;
  beforeFiles: File[];
  afterFiles: File[];
  createdAt: string;
  attempts: number;
  lastError?: string;
}
