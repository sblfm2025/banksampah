import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let environment: RulesTestEnvironment;

function pickupAudit(
  actorId: string,
  actorRole: 'SUPER_ADMIN' | 'OPERATOR' | 'DRIVER',
  action: string,
  beforeStatus: string,
  afterStatus: string,
) {
  return {
    actorId,
    actorRole,
    action,
    entityType: 'PICKUP_REQUEST',
    entityId: 'ticket-1',
    before: { status: beforeStatus },
    after: { status: afterStatus },
    createdAt: serverTimestamp(),
  };
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'sampahta-rules-test',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/admin-1'), {
        role: 'SUPER_ADMIN',
        isActive: true,
      }),
      setDoc(doc(db, 'users/operator-1'), {
        role: 'OPERATOR',
        isActive: true,
      }),
      setDoc(doc(db, 'users/driver-1'), {
        role: 'DRIVER',
        isActive: true,
      }),
      setDoc(doc(db, 'users/driver-2'), {
        role: 'DRIVER',
        isActive: true,
      }),
      setDoc(doc(db, 'pickupRequests/ticket-1'), {
        assignedDriverId: 'driver-1',
        status: 'ASSIGNED',
      }),
      setDoc(doc(db, 'customers/customer-1'), {
        phoneNumber: '628123456789',
      }),
      setDoc(doc(db, 'auditLogs/log-1'), {
        action: 'PICKUP_REQUEST_CREATED',
      }),
    ]);
  });
});

afterAll(async () => {
  await environment?.cleanup();
});

describe('Firestore role access', () => {
  const customerProfile = {
    name: 'Andi Saputra',
    email: 'andi@example.com',
    phoneNumber: '6281234567890',
    role: 'CUSTOMER',
    isActive: true,
    addressText: 'Jalan Bulu Manarang dekat masjid',
    district: 'PALETEANG',
    villageId: 'temmassarangnge',
    location: { lat: -3.78, lng: 119.65 },
    locationSource: 'MANUAL_PIN',
    locationValidationStatus: 'INSIDE_SERVICE_AREA',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  it('warga Google dapat membuat profil lengkap miliknya sendiri', async () => {
    const db = environment
      .authenticatedContext('customer-google', {
        email: 'andi@example.com',
      })
      .firestore();

    await assertSucceeds(
      setDoc(doc(db, 'users/customer-google'), customerProfile),
    );
    await assertSucceeds(getDoc(doc(db, 'users/customer-google')));
  });

  it('warga tidak dapat menaikkan role atau menulis profil akun lain', async () => {
    const db = environment
      .authenticatedContext('customer-google', {
        email: 'andi@example.com',
      })
      .firestore();

    await assertFails(
      setDoc(doc(db, 'users/customer-google'), {
        ...customerProfile,
        role: 'SUPER_ADMIN',
      }),
    );
    await assertFails(
      setDoc(doc(db, 'users/customer-lain'), customerProfile),
    );
  });

  it('warga wajib menyimpan kontak, alamat, dan titik terverifikasi', async () => {
    const db = environment
      .authenticatedContext('customer-google', {
        email: 'andi@example.com',
      })
      .firestore();
    const withoutPhone = { ...customerProfile } as Partial<
      typeof customerProfile
    >;
    delete withoutPhone.phoneNumber;

    await assertFails(
      setDoc(doc(db, 'users/customer-google'), withoutPhone),
    );
    await assertFails(
      setDoc(doc(db, 'users/customer-google'), {
        ...customerProfile,
        locationValidationStatus: 'UNKNOWN',
      }),
    );
  });

  it('operator dapat membaca tiket dan customer', async () => {
    const db = environment
      .authenticatedContext('operator-1')
      .firestore();

    await assertSucceeds(getDoc(doc(db, 'pickupRequests/ticket-1')));
    await assertSucceeds(getDoc(doc(db, 'customers/customer-1')));
  });

  it('hanya super admin yang dapat mengelola profil petugas', async () => {
    const adminDb = environment.authenticatedContext('admin-1').firestore();
    const operatorDb = environment
      .authenticatedContext('operator-1')
      .firestore();
    const profile = {
      name: 'Petugas Baru',
      email: 'petugas@example.com',
      phoneNumber: '628123456789',
      role: 'DRIVER',
      isActive: true,
    };

    await assertSucceeds(
      setDoc(doc(adminDb, 'users/new-driver'), profile),
    );
    await assertFails(
      setDoc(doc(operatorDb, 'users/operator-created-driver'), profile),
    );
    await assertFails(
      setDoc(doc(adminDb, 'users/invalid-driver'), {
        ...profile,
        unexpectedField: true,
      }),
    );
  });

  it('driver hanya dapat membaca tiket yang ditugaskan kepadanya', async () => {
    const assignedDb = environment
      .authenticatedContext('driver-1')
      .firestore();
    const otherDb = environment.authenticatedContext('driver-2').firestore();

    await assertSucceeds(
      getDoc(doc(assignedDb, 'pickupRequests/ticket-1')),
    );
    await assertFails(getDoc(doc(otherDb, 'pickupRequests/ticket-1')));
  });

  it('driver tidak dapat mengubah tiket secara langsung', async () => {
    const db = environment.authenticatedContext('driver-1').firestore();

    await assertFails(
      updateDoc(doc(db, 'pickupRequests/ticket-1'), {
        status: 'IN_PROGRESS',
      }),
    );
  });

  it('operator hanya dapat menjalankan transisi operasional yang sah', async () => {
    const db = environment.authenticatedContext('operator-1').firestore();

    await assertFails(
      updateDoc(doc(db, 'pickupRequests/ticket-1'), {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
      }),
    );

    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests/ticket-1'), {
      status: 'CANCELLED',
      updatedAt: serverTimestamp(),
      lastAuditId: 'operator-cancelled',
    });
    batch.set(
      doc(db, 'auditLogs/operator-cancelled'),
      pickupAudit(
        'operator-1',
        'OPERATOR',
        'PICKUP_STATUS_CHANGED',
        'ASSIGNED',
        'CANCELLED',
      ),
    );
    await assertSucceeds(batch.commit());

    await assertFails(
      updateDoc(doc(db, 'pickupRequests/ticket-1'), {
        customerPhoneNumber: '628000000000',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('driver dapat memulai tiket miliknya dengan field terbatas', async () => {
    const db = environment.authenticatedContext('driver-1').firestore();

    await assertFails(
      updateDoc(doc(db, 'pickupRequests/ticket-1'), {
        status: 'IN_PROGRESS',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    const batch = writeBatch(db);
    batch.update(doc(db, 'pickupRequests/ticket-1'), {
      status: 'IN_PROGRESS',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastAuditId: 'driver-started',
    });
    batch.set(
      doc(db, 'auditLogs/driver-started'),
      pickupAudit(
        'driver-1',
        'DRIVER',
        'PICKUP_STARTED',
        'ASSIGNED',
        'IN_PROGRESS',
      ),
    );

    await assertSucceeds(batch.commit());
  });

  it('driver hanya dapat menyelesaikan tiket bersama dokumen bukti', async () => {
    const db = environment.authenticatedContext('driver-1').firestore();

    await assertFails(
      updateDoc(doc(db, 'pickupRequests/ticket-1'), {
        status: 'COMPLETED',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    const batch = writeBatch(db);
    batch.set(doc(db, 'pickupProofs/ticket-1'), {
      pickupRequestId: 'ticket-1',
      driverId: 'driver-1',
      beforePhotoUrls: ['firestore://pickupProofMedia/media-1'],
      afterPhotoUrls: [],
      actualTripResult: 'COMPLETED_ONE_TRIP',
      driverNotes: null,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'pickupRequests/ticket-1'), {
      status: 'COMPLETED',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastAuditId: 'driver-completed',
    });
    batch.set(
      doc(db, 'auditLogs/driver-completed'),
      pickupAudit(
        'driver-1',
        'DRIVER',
        'PICKUP_RESULT_RECORDED',
        'ASSIGNED',
        'COMPLETED',
      ),
    );

    await assertSucceeds(batch.commit());
  });

  it('driver hanya dapat membuat bukti untuk tugasnya sendiri', async () => {
    const assignedDb = environment
      .authenticatedContext('driver-1')
      .firestore();
    const otherDb = environment.authenticatedContext('driver-2').firestore();
    const proof = {
      pickupRequestId: 'ticket-1',
      driverId: 'driver-1',
      beforePhotoUrls: ['https://example.com/before.jpg'],
      afterPhotoUrls: [],
      actualTripResult: 'COMPLETED_ONE_TRIP',
      driverNotes: null,
      createdAt: serverTimestamp(),
    };

    await assertSucceeds(
      setDoc(doc(assignedDb, 'pickupProofs/ticket-1'), proof),
    );
    await assertFails(
      setDoc(doc(otherDb, 'pickupProofs/ticket-1'), {
        ...proof,
        driverId: 'driver-2',
      }),
    );
  });

  it('driver hanya dapat menyimpan reason code resmi dengan catatan wajib', async () => {
    const db = environment.authenticatedContext('driver-1').firestore();
    const baseProof = {
      pickupRequestId: 'ticket-1',
      driverId: 'driver-1',
      beforePhotoUrls: ['https://example.com/before.jpg'],
      afterPhotoUrls: [],
      createdAt: serverTimestamp(),
    };

    await assertFails(
      setDoc(doc(db, 'pickupProofs/ticket-1'), {
        ...baseProof,
        actualTripResult: 'UNKNOWN_RESULT',
        driverNotes: 'Nilai ini tidak resmi.',
      }),
    );
    await assertFails(
      setDoc(doc(db, 'pickupProofs/ticket-1'), {
        ...baseProof,
        actualTripResult: 'HAZARDOUS_WASTE_FOUND',
        driverNotes: null,
      }),
    );

    const batch = writeBatch(db);
    batch.set(doc(db, 'pickupProofs/ticket-1'), {
      ...baseProof,
      actualTripResult: 'HAZARDOUS_WASTE_FOUND',
      driverNotes: 'Terlihat kemasan bahan kimia, perlu pemeriksaan operator.',
    });
    batch.update(doc(db, 'pickupRequests/ticket-1'), {
      status: 'NEEDS_OPERATOR_REVIEW',
      driverNotes: 'Terlihat kemasan bahan kimia, perlu pemeriksaan operator.',
      updatedAt: serverTimestamp(),
      lastAuditId: 'driver-hazardous-review',
    });
    batch.set(
      doc(db, 'auditLogs/driver-hazardous-review'),
      pickupAudit(
        'driver-1',
        'DRIVER',
        'PICKUP_RESULT_RECORDED',
        'ASSIGNED',
        'NEEDS_OPERATOR_REVIEW',
      ),
    );

    await assertSucceeds(batch.commit());
  });

  it('media bukti Firestore hanya dapat diakses pihak berhak', async () => {
    const assignedDb = environment
      .authenticatedContext('driver-1')
      .firestore();
    const otherDb = environment.authenticatedContext('driver-2').firestore();
    const operatorDb = environment
      .authenticatedContext('operator-1')
      .firestore();
    const media = {
      pickupRequestId: 'ticket-1',
      driverId: 'driver-1',
      kind: 'before',
      contentType: 'image/jpeg',
      byteSize: 3,
      width: 10,
      height: 10,
      dataUrl: 'data:image/jpeg;base64,AAA=',
      originalName: 'proof.jpg',
      sequence: 0,
      createdAt: new Date(),
    };

    await assertSucceeds(
      setDoc(doc(assignedDb, 'pickupProofMedia/media-1'), media),
    );
    await assertSucceeds(
      getDoc(doc(operatorDb, 'pickupProofMedia/media-1')),
    );
    await assertFails(getDoc(doc(otherDb, 'pickupProofMedia/media-1')));
    await assertFails(
      setDoc(doc(otherDb, 'pickupProofMedia/media-2'), {
        ...media,
        driverId: 'driver-2',
      }),
    );
  });

  it('menolak media bukti yang melewati batas ukuran', async () => {
    const db = environment.authenticatedContext('driver-1').firestore();

    await assertFails(
      setDoc(doc(db, 'pickupProofMedia/media-large'), {
        pickupRequestId: 'ticket-1',
        driverId: 'driver-1',
        kind: 'after',
        contentType: 'image/jpeg',
        byteSize: 300001,
        width: 1280,
        height: 720,
        dataUrl: 'data:image/jpeg;base64,AAA=',
        originalName: 'large.jpg',
        sequence: 0,
        createdAt: new Date(),
      }),
    );
  });

  it('hanya super admin yang dapat membaca audit log', async () => {
    const adminDb = environment.authenticatedContext('admin-1').firestore();
    const operatorDb = environment
      .authenticatedContext('operator-1')
      .firestore();

    await assertSucceeds(getDoc(doc(adminDb, 'auditLogs/log-1')));
    await assertFails(getDoc(doc(operatorDb, 'auditLogs/log-1')));
    await assertFails(
      setDoc(
        doc(operatorDb, 'auditLogs/standalone-log'),
        pickupAudit(
          'operator-1',
          'OPERATOR',
          'PICKUP_STATUS_CHANGED',
          'ASSIGNED',
          'CANCELLED',
        ),
      ),
    );
  });

  it('client tidak dapat menulis koleksi internal', async () => {
    const db = environment.authenticatedContext('admin-1').firestore();

    await assertFails(
      setDoc(doc(db, 'idempotencyKeys/key-1'), {
        entityId: 'ticket-1',
      }),
    );
    await assertFails(
      getDoc(doc(db, 'reminderDeliveries/reminder-1')),
    );
    await assertFails(
      setDoc(doc(db, 'reminderDeliveries/reminder-1'), {
        ticketId: 'ticket-1',
        status: 'SENT',
      }),
    );
  });
});
