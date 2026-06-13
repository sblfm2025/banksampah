# 04 — WhatsApp dan AI Workflow

## 1. Tujuan Modul

Modul ini menjadi pintu utama layanan. Pengguna tidak perlu install aplikasi. Pengguna cukup mengirim pesan WhatsApp, foto sampah, dan lokasi.

AI Gemini 2.5 Flash membantu:

- memahami maksud pesan,
- membaca foto sampah,
- memperkirakan volume visual,
- menentukan jenis layanan yang cocok,
- membuat ringkasan untuk operator,
- membuat balasan singkat kepada pengguna.

## 2. Alur WhatsApp

```text
Pengguna kirim teks/foto/lokasi
        ↓
Webhook menerima pesan
        ↓
Pesan disimpan ke whatsappMessages
        ↓
Jika foto: download dan simpan ke Storage
        ↓
AI analisa teks + foto + lokasi
        ↓
Validasi output AI dengan Zod
        ↓
Buat/update customer
        ↓
Buat/update pickup request
        ↓
Kirim balasan WhatsApp
```

## 3. Jenis Pesan yang Didukung

| Jenis | Perlakuan |
|---|---|
| Text | Dianalisa sebagai maksud pengguna |
| Image | Disimpan, lalu dianalisa AI |
| Location | Disimpan sebagai koordinat pickup |
| Audio | Belum diproses pada MVP; balas minta teks/foto |
| Document | Belum diproses pada MVP |

## 4. Guardrail AI

AI tidak boleh:

1. Menghitung berat kilogram.
2. Menjanjikan harga final.
3. Menjanjikan jadwal final sebelum operator konfirmasi.
4. Menganggap semua sampah bisa dilayani.
5. Membuat tiket aktif di luar Watang Sawitto dan Paleteang.
6. Memberi klaim pasti dari foto.

AI boleh:

1. Mengestimasi volume visual.
2. Mengestimasi kapasitas bak motor 3 roda.
3. Menyarankan layanan reguler atau 1 kali jalan.
4. Meminta data kurang.
5. Menandai risiko sampah berbahaya.
6. Membuat ringkasan operator.

## 5. Klasifikasi Volume

```ts
export type VolumeLevel = 'SMALL' | 'MEDIUM' | 'LARGE' | 'OVERSIZED' | 'UNKNOWN';
```

Definisi:

- `SMALL`: 1–3 kantong sampah rumah tangga.
- `MEDIUM`: 4–8 kantong, beberapa karung kecil, beberapa kardus.
- `LARGE`: tumpukan besar, banyak karung/kardus, kemungkinan cukup 1 motor sampah 3 roda.
- `OVERSIZED`: tampak melebihi kapasitas motor sampah 3 roda.
- `UNKNOWN`: foto tidak jelas atau data kurang.

## 6. Estimasi Bak Motor Sampah 3 Roda

```ts
export type TricycleLoadEstimate =
  | 'NONE'
  | 'QUARTER'
  | 'HALF'
  | 'THREE_QUARTERS'
  | 'FULL'
  | 'OVER_CAPACITY'
  | 'UNKNOWN';
```

Definisi:

- `QUARTER`: sekitar 25% bak.
- `HALF`: sekitar 50% bak.
- `THREE_QUARTERS`: sekitar 75% bak.
- `FULL`: mendekati penuh.
- `OVER_CAPACITY`: kemungkinan lebih dari 1 trip.
- `UNKNOWN`: tidak bisa dinilai.

## 7. Prompt Sistem Gemini

Buat file:

`src/server/ai/prompts/waste-analysis.prompt.ts`

```ts
export const WASTE_ANALYSIS_SYSTEM_PROMPT = `
Anda adalah AI Assistant untuk layanan Jemput Sampah Pinrang.
Tugas Anda adalah membantu operator membaca pesan WhatsApp dan foto sampah dari warga.

Wilayah layanan MVP hanya:
1. Watang Sawitto
2. Paleteang

Fokus layanan saat ini:
1. Penjemputan reguler rumah tangga
2. Pengangkutan 1 kali jalan motor sampah 3 roda

Jangan menghitung harga per kilogram.
Jangan mengestimasi berat kilogram.
Jangan menjanjikan harga final.
Jangan menjanjikan jadwal final sebelum operator mengonfirmasi.

Anda hanya boleh:
- memahami maksud pesan pengguna,
- menganalisa apakah foto menunjukkan sampah,
- mengestimasi volume visual: SMALL, MEDIUM, LARGE, OVERSIZED,
- mengestimasi kapasitas motor sampah 3 roda: QUARTER, HALF, THREE_QUARTERS, FULL, OVER_CAPACITY, UNKNOWN,
- menentukan apakah cocok pickup reguler atau 1 kali jalan,
- menandai jika butuh operator review,
- menandai jika ada risiko sampah berbahaya,
- menyusun balasan singkat dan sopan untuk pengguna,
- menyusun ringkasan untuk operator.

Definisi volume:
SMALL: 1-3 kantong sampah rumah tangga.
MEDIUM: 4-8 kantong, beberapa karung kecil, atau beberapa kardus.
LARGE: tumpukan besar, banyak karung/kardus, kemungkinan cukup 1 motor sampah 3 roda.
OVERSIZED: tampak melebihi kapasitas motor sampah 3 roda, perlu konfirmasi operator.

Jenis sampah yang harus ditandai khusus:
- limbah medis,
- jarum suntik,
- bahan kimia,
- oli/cairan berbahaya,
- bangkai hewan,
- puing bangunan berat,
- material tajam berbahaya.

Jika data kurang, minta data yang kurang dengan bahasa sederhana.
Jika tidak ada alamat, minta alamat atau share location.
Jika tidak ada foto, minta foto.
Jika di luar Watang Sawitto dan Paleteang, jelaskan bahwa layanan baru tersedia di dua kecamatan tersebut.

Gunakan bahasa Indonesia yang ramah, sederhana, dan tidak teknis.
Jangan gunakan istilah rumit kepada pengguna.

Output wajib JSON valid sesuai schema.
`;
```

## 8. User Prompt Builder

```ts
export const buildWasteAnalysisUserPrompt = (input: {
  text?: string;
  hasImage: boolean;
  hasLocation: boolean;
  locationText?: string;
}) => `
Analisa permintaan berikut.

Pesan pengguna:
${input.text || '(tidak ada teks)'}

Ada foto: ${input.hasImage ? 'YA' : 'TIDAK'}
Ada lokasi/share location: ${input.hasLocation ? 'YA' : 'TIDAK'}
Keterangan lokasi jika ada:
${input.locationText || '(tidak ada)'}

Kembalikan JSON dengan format:

{
  "intent": "PICKUP_REQUEST | REGULAR_SUBSCRIPTION_INQUIRY | ASK_PRICE | ASK_AREA | COMPLAINT | OTHER",
  "detectedDistrict": "WATANG_SAWITTO | PALETEANG | OUT_OF_AREA | UNKNOWN",
  "addressCompleteness": "COMPLETE | PARTIAL | MISSING",
  "photoQuality": "CLEAR | PARTIAL | BLURRY | NO_PHOTO",
  "wasteVisible": true,
  "detectedWasteTypes": ["HOUSEHOLD_MIXED"],
  "volumeLevel": "SMALL | MEDIUM | LARGE | OVERSIZED | UNKNOWN",
  "tricycleLoadEstimate": "NONE | QUARTER | HALF | THREE_QUARTERS | FULL | OVER_CAPACITY | UNKNOWN",
  "recommendedServiceType": "REGULAR_HOUSEHOLD_PICKUP | ONE_TRIP_TRICYCLE | NEEDS_OPERATOR_REVIEW | REJECT",
  "needsOperatorReview": true,
  "needsMoreInfo": true,
  "missingFields": ["DISTRICT", "ADDRESS", "LOCATION", "PHOTO", "WASTE_DESCRIPTION"],
  "safetyFlags": ["NONE"],
  "customerReply": "balasan singkat untuk pengguna WhatsApp",
  "operatorSummary": "ringkasan singkat untuk operator",
  "confidence": 0.0
}
`;
```

## 9. Template Balasan WhatsApp

### 9.1 Minta Alamat

```ts
export const askAddressTemplate = `
Baik, permintaan jemput sampah bisa kami bantu.

Mohon kirim alamat lengkap atau share location WhatsApp.
Untuk tahap awal layanan tersedia di Watang Sawitto dan Paleteang.
`;
```

### 9.2 Minta Foto

```ts
export const askPhotoTemplate = `
Baik, agar kami bisa cek perkiraan volume sampahnya, mohon kirim foto sampah dari jarak yang cukup jelas.
`;
```

### 9.3 Tiket Dibuat

```ts
export const ticketCreatedTemplate = (ticketCode: string, summary: string) => `
Siap, permintaan jemput sampah sudah kami terima.

Nomor tiket: ${ticketCode}

${summary}

Operator akan mengonfirmasi jadwal penjemputan.
`;
```

### 9.4 Di Luar Wilayah

```ts
export const outOfAreaTemplate = `
Mohon maaf, untuk tahap awal layanan jemput sampah baru tersedia di Watang Sawitto dan Paleteang.

Lokasi Bapak/Ibu bisa kami catat sebagai daftar tunggu pengembangan layanan.
`;
```

### 9.5 Volume Besar

```ts
export const largeVolumeTemplate = (ticketCode: string) => `
Siap, dari foto volume sampah terlihat cukup besar dan kemungkinan cocok untuk 1 kali jalan motor sampah 3 roda.

Nomor tiket: ${ticketCode}

Operator akan mengecek dan mengonfirmasi jadwal serta ketersediaan armada.
`;
```

### 9.6 Kemungkinan Extra Trip

```ts
export const oversizedTemplate = (ticketCode: string) => `
Terima kasih, permintaan sudah kami terima.

Nomor tiket: ${ticketCode}

Dari foto, volume terlihat sangat besar dan mungkin melebihi kapasitas 1 kali jalan motor sampah. Operator akan menghubungi untuk konfirmasi.
`;
```
