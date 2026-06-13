import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  auditActorSchema,
  auditEntityTypeSchema,
  type AuditActor,
  type AuditEntityType,
} from '../../shared/schemas/audit.schema';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';

export interface WriteAuditLogInput {
  actor?: AuditActor;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

export class AuditLogService {
  constructor(private readonly db: Firestore = adminDb) {}

  async write(input: WriteAuditLogInput): Promise<string> {
    const actor = auditActorSchema.parse(input.actor ?? {});
    const entityType = auditEntityTypeSchema.parse(input.entityType);
    const reference = this.db.collection(COLLECTIONS.auditLogs).doc();

    await reference.set({
      actorId: actor.id,
      actorRole: actor.role,
      action: input.action,
      entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      createdAt: Timestamp.now(),
    });

    return reference.id;
  }
}
