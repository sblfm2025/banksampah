import { getOperationalDate } from '../../shared/utils/date';
import type { PublicTicket } from './public-data';
import { compressImage } from '../driver/firestore-proof-media';

function volumeToLoad(volume: PublicTicket['volume']) {
  return {
    SMALL: 'QUARTER',
    MEDIUM: 'HALF',
    LARGE: 'FULL',
    OVERSIZED: 'OVER_CAPACITY',
  }[volume];
}

async function numericSuffix(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  const bytes = new Uint8Array(digest);
  const number = ((bytes[0] << 8) | bytes[1]) % 10_000;
  return number.toString().padStart(4, '0');
}

export async function submitPublicTicket(
  ticket: PublicTicket,
  ownerUid: string,
  photoFile: File,
) {
  const [
    { collection, doc, serverTimestamp, writeBatch },
    { db },
  ] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
  ]);
  const ticketReference = doc(collection(db, 'pickupRequests'));
  const mediaReference = doc(
    db,
    'customerWasteMedia',
    `${ticketReference.id}_intake`,
  );
  const compressed = await compressImage(photoFile);
  const ticketCode = `JSP-${getOperationalDate()
    .replaceAll('-', '')}-${await numericSuffix(ticketReference.id)}`;
  const timestamp = serverTimestamp();
  const batch = writeBatch(db);

  batch.set(ticketReference, {
    ticketCode,
    source: 'PWA',
    customerId: ownerUid,
    ownerUid,
    customerPhoneNumber: ticket.customerPhoneNumber,
    customerName: ticket.customerName,
    district: ticket.district,
    villageId: ticket.villageId,
    addressText: ticket.address,
    location: ticket.location,
    ...(ticket.locationAccuracyMeters === undefined
      ? {}
      : { locationAccuracyMeters: ticket.locationAccuracyMeters }),
    locationSource: ticket.locationSource,
    locationValidationStatus: ticket.locationValidationStatus,
    serviceType: ticket.service,
    serviceCategory: 'warga',
    serviceModel: 'gratis',
    volumeLevel: ticket.volume,
    tricycleLoadEstimate: volumeToLoad(ticket.volume),
    ...(ticket.notes?.trim()
      ? { wasteDescription: ticket.notes.trim() }
      : {}),
    wasteTypes: [],
    dataQuality: 'estimated_by_user',
    paymentStatus: 'gratis',
    impactTags: ['pengurangan_sampah'],
    photoUrls: [],
    intakePhotoMediaIds: [mediaReference.id],
    status: 'NEW',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  batch.set(mediaReference, {
    pickupRequestId: ticketReference.id,
    ownerUid,
    contentType: compressed.contentType,
    byteSize: compressed.bytes.byteLength,
    width: compressed.width,
    height: compressed.height,
    dataUrl: compressed.dataUrl,
    originalName: photoFile.name.slice(0, 120),
    createdAt: timestamp,
  });
  await batch.commit();

  return {
    id: ticketReference.id,
    ticketCode,
  };
}

export async function loadCustomerTickets(ownerUid: string) {
  const [
    { collection, getDocs, limit, query, where },
    { db },
    { parsePickupSnapshot },
  ] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
    import('../../client/firestore-pickup'),
  ]);
  const snapshot = await getDocs(
    query(
      collection(db, 'pickupRequests'),
      where('ownerUid', '==', ownerUid),
      limit(100),
    ),
  );
  return snapshot.docs
    .map(parsePickupSnapshot)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadCustomerTicket(id: string) {
  const [{ doc, getDoc }, { db }, { parsePickupSnapshot }] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
    import('../../client/firestore-pickup'),
  ]);
  return parsePickupSnapshot(await getDoc(doc(db, 'pickupRequests', id)));
}
