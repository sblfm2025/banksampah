import type { ProofKind } from './driver.types';

const COLLECTION = 'pickupProofMedia';
const REFERENCE_PREFIX = `firestore://${COLLECTION}/`;
const MAX_DIMENSION = 1280;
const TARGET_BYTES = 300_000;
const MIN_QUALITY = 0.45;

export function createFirestoreProofReference(id: string) {
  return `${REFERENCE_PREFIX}${id}`;
}

export function parseFirestoreProofReference(reference: string) {
  return reference.startsWith(REFERENCE_PREFIX)
    ? reference.slice(REFERENCE_PREFIX.length)
    : null;
}

export async function uploadProofMediaToFirestore(
  driverId: string,
  ticketId: string,
  kind: ProofKind,
  files: File[],
) {
  const [{ doc, setDoc, Timestamp }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
  ]);

  return Promise.all(
    files.map(async (file, index) => {
      const compressed = await compressImage(file);
      const hash = await sha256(compressed.bytes);
      const id = `${ticketId}_${kind}_${hash.slice(0, 24)}`;
      const reference = doc(db, COLLECTION, id);

      await setDoc(reference, {
        pickupRequestId: ticketId,
        driverId,
        kind,
        contentType: compressed.contentType,
        byteSize: compressed.bytes.byteLength,
        width: compressed.width,
        height: compressed.height,
        dataUrl: compressed.dataUrl,
        originalName: file.name.slice(0, 120),
        sequence: index,
        createdAt: Timestamp.now(),
      });

      return createFirestoreProofReference(id);
    }),
  );
}

export async function compressImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Format foto harus JPEG, PNG, atau WebP.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Browser tidak mendukung kompresi foto.');
  }

  let blob: Blob;
  while (true) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.82;
    blob = await canvasToBlob(canvas, quality);
    while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.08);
      blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size <= TARGET_BYTES || Math.max(width, height) <= 640) break;
    width = Math.max(1, Math.round(width * 0.8));
    height = Math.max(1, Math.round(height * 0.8));
  }
  bitmap.close();

  if (blob.size > TARGET_BYTES) {
    throw new Error(
      'Foto masih terlalu besar setelah dikompresi. Ambil ulang dari jarak sedikit lebih jauh.',
    );
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  return {
    bytes,
    contentType: 'image/jpeg',
    dataUrl: `data:image/jpeg;base64,${bytesToBase64(bytes)}`,
    width,
    height,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Foto gagal dikompresi.')),
      'image/jpeg',
      quality,
    );
  });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function sha256(bytes: Uint8Array) {
  const source = Uint8Array.from(bytes).buffer;
  const digest = await crypto.subtle.digest('SHA-256', source);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
