import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '../firebase/admin';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

interface MetaMediaMetadata {
  url: string;
  mime_type?: string;
  file_size?: number;
}

export interface StoredMedia {
  bytes: Buffer;
  mimeType: string;
  storageUrl: string;
}

export interface MediaService {
  downloadAndStoreImage(input: {
    mediaId: string;
    preferredMimeType?: string;
    phoneNumber: string;
    waMessageId: string;
  }): Promise<StoredMedia>;
  readStoredImage(storageUrl: string): Promise<AnalysisMedia>;
}

export interface AnalysisMedia {
  bytes: Buffer;
  mimeType: string;
}

export class WhatsAppMediaService implements MediaService {
  constructor(
    private readonly accessToken: string,
    private readonly graphApiVersion = 'v25.0',
    private readonly bucket = getStorage(getAdminApp()).bucket(),
  ) {}

  async downloadAndStoreImage(input: {
    mediaId: string;
    preferredMimeType?: string;
    phoneNumber: string;
    waMessageId: string;
  }): Promise<StoredMedia> {
    const metadataResponse = await fetch(
      `https://graph.facebook.com/${this.graphApiVersion}/${input.mediaId}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!metadataResponse.ok) {
      throw new Error(`MEDIA_METADATA_FAILED:${metadataResponse.status}`);
    }

    const metadata = (await metadataResponse.json()) as MetaMediaMetadata;
    if (metadata.file_size && metadata.file_size > MAX_IMAGE_BYTES) {
      throw new Error('MEDIA_TOO_LARGE');
    }

    const mediaResponse = await fetch(metadata.url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!mediaResponse.ok) {
      throw new Error(`MEDIA_DOWNLOAD_FAILED:${mediaResponse.status}`);
    }

    const bytes = Buffer.from(await mediaResponse.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('MEDIA_TOO_LARGE');
    }

    const mimeType =
      metadata.mime_type ??
      mediaResponse.headers.get('content-type') ??
      input.preferredMimeType ??
      '';
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw new Error(`UNSUPPORTED_MEDIA_TYPE:${mimeType || 'unknown'}`);
    }

    const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
    const safePhone = input.phoneNumber.replaceAll(/\D/g, '');
    const safeMessageId = input.waMessageId.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
    const path = `customer-waste/${safePhone}/${safeMessageId}.${extension}`;
    const file = this.bucket.file(path);

    await file.save(bytes, {
      resumable: false,
      contentType: mimeType,
      metadata: {
        metadata: {
          source: 'WHATSAPP',
          waMessageId: input.waMessageId,
        },
      },
    });

    return {
      bytes,
      mimeType,
      storageUrl: `gs://${this.bucket.name}/${path}`,
    };
  }

  async readStoredImage(storageUrl: string): Promise<AnalysisMedia> {
    const prefix = `gs://${this.bucket.name}/`;
    if (!storageUrl.startsWith(prefix)) {
      throw new Error('INVALID_STORAGE_URL');
    }

    const file = this.bucket.file(storageUrl.slice(prefix.length));
    const [[bytes], [metadata]] = await Promise.all([
      file.download(),
      file.getMetadata(),
    ]);
    const mimeType = metadata.contentType ?? '';

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw new Error(`UNSUPPORTED_MEDIA_TYPE:${mimeType || 'unknown'}`);
    }

    return { bytes, mimeType };
  }
}
