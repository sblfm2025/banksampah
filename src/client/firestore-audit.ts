import type { AppUser } from '../shared/schemas/user.schema';

export type PickupAuditAction =
  | 'PICKUP_STATUS_CHANGED'
  | 'PICKUP_IMPACT_UPDATED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_DRIVER_ASSIGNED'
  | 'PICKUP_STARTED'
  | 'PICKUP_RESULT_RECORDED';

export async function getCurrentAuditActor(
  allowedRoles: AppUser['role'][],
): Promise<Pick<AppUser, 'id' | 'role'>> {
  const { auth, getAppUser } = await import('./firebase');
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('Sesi login tidak tersedia.');
  }

  const appUser = await getAppUser(firebaseUser.uid);
  if (!appUser?.isActive || !allowedRoles.includes(appUser.role)) {
    throw new Error('Akun tidak memiliki izin untuk tindakan ini.');
  }

  return { id: appUser.id, role: appUser.role };
}

export function buildPickupAudit(
  actor: Pick<AppUser, 'id' | 'role'>,
  action: PickupAuditAction,
  ticketId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  createdAt: unknown,
) {
  return {
    actorId: actor.id,
    actorRole: actor.role,
    action,
    entityType: 'PICKUP_REQUEST',
    entityId: ticketId,
    before,
    after,
    createdAt,
  };
}
