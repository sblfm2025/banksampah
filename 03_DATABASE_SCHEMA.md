# 03 — Database Schema Firestore

## 1. Prinsip Database

Database harus cukup sederhana untuk MVP, tetapi tetap siap dikembangkan ke fase berikutnya.

Fokus data MVP:

- pengguna/operator/petugas,
- customer berbasis nomor WhatsApp,
- pesan WhatsApp,
- tiket pickup,
- hasil analisa AI,
- jadwal pickup,
- bukti pickup,
- laporan operasional.

## 2. users

```ts
interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'SUPER_ADMIN' | 'OPERATOR' | 'DRIVER' | 'CUSTOMER';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 3. customers

```ts
interface Customer {
  id: string;
  phoneNumber: string;
  displayName?: string;
  fullName?: string;
  district?: 'WATANG_SAWITTO' | 'PALETEANG' | 'OUT_OF_AREA' | 'UNKNOWN';
  village?: string;
  addressText?: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  createdFrom: 'WHATSAPP' | 'ADMIN';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 4. whatsappMessages

```ts
interface WhatsAppMessage {
  id: string;
  waMessageId: string;
  fromPhoneNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'AUDIO' | 'UNKNOWN';
  text?: string;
  mediaUrl?: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  };
  rawPayload: any;
  processed: boolean;
  relatedTicketId?: string;
  createdAt: Timestamp;
}
```

## 5. pickupRequests

```ts
interface PickupRequest {
  id: string;
  ticketCode: string;

  source: 'WHATSAPP' | 'ADMIN' | 'PWA';
  customerId: string;
  customerPhoneNumber: string;
  customerName?: string;

  district: 'WATANG_SAWITTO' | 'PALETEANG' | 'OUT_OF_AREA' | 'UNKNOWN';
  village?: string;
  addressText?: string;
  location?: {
    lat: number;
    lng: number;
  };

  serviceType:
    | 'REGULAR_HOUSEHOLD_PICKUP'
    | 'ONE_TRIP_TRICYCLE'
    | 'UNKNOWN';

  volumeLevel: 'SMALL' | 'MEDIUM' | 'LARGE' | 'OVERSIZED' | 'UNKNOWN';

  tricycleLoadEstimate:
    | 'NONE'
    | 'QUARTER'
    | 'HALF'
    | 'THREE_QUARTERS'
    | 'FULL'
    | 'OVER_CAPACITY'
    | 'UNKNOWN';

  wasteDescription?: string;
  photoUrls: string[];

  aiAnalysis?: WasteAiAnalysis;

  status: PickupStatus;

  scheduledDate?: string;
  scheduledTimeWindow?: {
    start: string;
    end: string;
  };

  assignedDriverId?: string;
  assignedDriverName?: string;

  operatorNotes?: string;
  driverNotes?: string;

  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  rejectedReason?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 6. PickupStatus

```ts
export type PickupStatus =
  | 'NEW'
  | 'NEEDS_INFO'
  | 'NEEDS_OPERATOR_REVIEW'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXTRA_TRIP_REQUIRED'
  | 'REJECTED'
  | 'CANCELLED';
```

## 7. WasteAiAnalysis

```ts
interface WasteAiAnalysis {
  id: string;
  pickupRequestId?: string;
  sourceMessageIds: string[];

  intent:
    | 'PICKUP_REQUEST'
    | 'REGULAR_SUBSCRIPTION_INQUIRY'
    | 'ASK_PRICE'
    | 'ASK_AREA'
    | 'COMPLAINT'
    | 'OTHER';

  detectedDistrict:
    | 'WATANG_SAWITTO'
    | 'PALETEANG'
    | 'OUT_OF_AREA'
    | 'UNKNOWN';

  addressCompleteness:
    | 'COMPLETE'
    | 'PARTIAL'
    | 'MISSING';

  photoQuality:
    | 'CLEAR'
    | 'PARTIAL'
    | 'BLURRY'
    | 'NO_PHOTO';

  wasteVisible: boolean;

  detectedWasteTypes: Array<
    | 'HOUSEHOLD_MIXED'
    | 'CARDBOARD'
    | 'PLASTIC'
    | 'ORGANIC'
    | 'GARDEN_WASTE'
    | 'BULKY_ITEM'
    | 'GLASS'
    | 'E_WASTE'
    | 'HAZARDOUS'
    | 'UNKNOWN'
  >;

  volumeLevel:
    | 'SMALL'
    | 'MEDIUM'
    | 'LARGE'
    | 'OVERSIZED'
    | 'UNKNOWN';

  tricycleLoadEstimate:
    | 'NONE'
    | 'QUARTER'
    | 'HALF'
    | 'THREE_QUARTERS'
    | 'FULL'
    | 'OVER_CAPACITY'
    | 'UNKNOWN';

  recommendedServiceType:
    | 'REGULAR_HOUSEHOLD_PICKUP'
    | 'ONE_TRIP_TRICYCLE'
    | 'NEEDS_OPERATOR_REVIEW'
    | 'REJECT';

  needsOperatorReview: boolean;
  needsMoreInfo: boolean;

  missingFields: Array<
    | 'DISTRICT'
    | 'ADDRESS'
    | 'LOCATION'
    | 'PHOTO'
    | 'WASTE_DESCRIPTION'
  >;

  safetyFlags: Array<
    | 'POSSIBLE_MEDICAL_WASTE'
    | 'POSSIBLE_CHEMICAL'
    | 'POSSIBLE_B3'
    | 'SHARP_OBJECTS'
    | 'CONSTRUCTION_DEBRIS'
    | 'DEAD_ANIMAL'
    | 'NONE'
  >;

  customerReply: string;
  operatorSummary: string;

  confidence: number;
  rawModelOutput: any;

  createdAt: Timestamp;
}
```

## 8. pickupSchedules

```ts
interface PickupSchedule {
  id: string;
  date: string;
  district: 'WATANG_SAWITTO' | 'PALETEANG';
  village?: string;
  timeWindow: {
    start: string;
    end: string;
  };
  driverId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  pickupRequestIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 9. pickupProofs

```ts
interface PickupProof {
  id: string;
  pickupRequestId: string;
  driverId: string;
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
  actualTripResult:
    | 'COMPLETED_ONE_TRIP'
    | 'PARTIAL_PICKUP'
    | 'EXTRA_TRIP_REQUIRED'
    | 'CUSTOMER_NOT_AVAILABLE'
    | 'CANCELLED_ON_SITE';

  driverNotes?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}
```

## 10. Index Firestore yang Perlu Disiapkan

## 10.1 reminderDeliveries

Koleksi internal untuk mencegah reminder terjadwal dikirim berulang.

```ts
interface ReminderDelivery {
  ticketId: string;
  targetDate: string;
  templateName: string;
  status: 'PROCESSING' | 'SENT' | 'FAILED';
  attempts: number;
  leaseUntil?: Timestamp;
  waMessageId?: string;
  errorName?: string;
  sentAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Client tidak boleh membaca atau menulis koleksi ini.

Buat index untuk query berikut:

1. `pickupRequests` by `status`, `createdAt desc`
2. `pickupRequests` by `district`, `createdAt desc`
3. `pickupRequests` by `scheduledDate`, `assignedDriverId`
4. `pickupRequests` by `customerPhoneNumber`, `createdAt desc`
5. `pickupSchedules` by `date`, `district`
6. `whatsappMessages` by `fromPhoneNumber`, `createdAt desc`

## 11. Ticket Code

Format ticket code:

```text
JSP-YYYYMMDD-0001
```

Contoh:

```text
JSP-20260613-0001
```

Ticket code harus mudah disebut lewat WhatsApp.
