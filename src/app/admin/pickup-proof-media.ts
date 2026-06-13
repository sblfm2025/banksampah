import { parseFirestoreProofReference } from '../driver/firestore-proof-media';

export interface PickupProofView {
  before: string[];
  after: string[];
  notes?: string;
  result?: string;
}

export async function loadPickupProof(
  ticketId: string,
): Promise<PickupProofView | null> {
  if (import.meta.env.VITE_USE_DEMO_DATA !== 'false') return null;
  const [{ doc, getDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
  ]);
  const proof = await getDoc(doc(db, 'pickupProofs', ticketId));
  if (!proof.exists()) return null;
  const data = proof.data();
  const beforeReferences = asReferences(data.beforePhotoUrls);
  const afterReferences = asReferences(data.afterPhotoUrls);

  return {
    before: await Promise.all(
      beforeReferences.map((reference) => resolveMedia(reference, getDoc, doc, db)),
    ),
    after: await Promise.all(
      afterReferences.map((reference) => resolveMedia(reference, getDoc, doc, db)),
    ),
    notes: typeof data.driverNotes === 'string' ? data.driverNotes : undefined,
    result:
      typeof data.actualTripResult === 'string'
        ? data.actualTripResult
        : undefined,
  };
}

function asReferences(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

async function resolveMedia(
  reference: string,
  getDoc: typeof import('firebase/firestore').getDoc,
  doc: typeof import('firebase/firestore').doc,
  db: import('firebase/firestore').Firestore,
) {
  const mediaId = parseFirestoreProofReference(reference);
  if (!mediaId) return reference;
  const media = await getDoc(doc(db, 'pickupProofMedia', mediaId));
  const dataUrl = media.data()?.dataUrl;
  if (typeof dataUrl !== 'string') {
    throw new Error('Media bukti tidak ditemukan.');
  }
  return dataUrl;
}
