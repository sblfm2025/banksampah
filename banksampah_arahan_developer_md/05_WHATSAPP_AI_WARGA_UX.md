# 05 — WhatsApp, AI, dan UX Warga/UMKM

Dokumen ini mengarahkan perbaikan alur warga agar aplikasi mudah dipakai oleh ibu rumah tangga, pelaku UMKM, toko, sekolah, kantor, dan masyarakat umum.

---

## 1. Prinsip UX warga

Warga tidak boleh dipaksa:

- memahami jenis sampah teknis,
- menghitung kilogram,
- mengisi form panjang,
- tahu istilah bank sampah,
- tahu kode status internal.

Warga cukup:

1. Chat WhatsApp.
2. Kirim foto sampah.
3. Kirim alamat/share location.
4. Menunggu konfirmasi operator.

---

## 2. Guardrail AI wajib

AI boleh:

- memahami maksud pesan,
- membaca foto sampah,
- memperkirakan volume visual,
- memperkirakan kapasitas motor 3 roda secara kasar,
- meminta data yang kurang,
- menandai potensi sampah berbahaya,
- membuat ringkasan operator.

AI tidak boleh:

- menghitung berat kg,
- menyebut harga final,
- menyebut saldo tabungan,
- menjanjikan jadwal final,
- menjamin semua sampah bisa dijemput,
- membuat tiket aktif di luar Watang Sawitto dan Paleteang,
- menyimpulkan pasti dari foto buram.

---

## 3. Status berdasarkan kelengkapan data

| Kondisi | Status | Balasan |
|---|---|---|
| Ada pesan, tidak ada foto | `NEEDS_INFO` | Minta foto |
| Ada foto, tidak ada alamat/lokasi | `NEEDS_INFO` | Minta alamat/share location |
| Ada lokasi luar wilayah | Jangan buat tiket aktif | Balas luar area + waitlist |
| Foto buram | `NEEDS_INFO` atau `NEEDS_OPERATOR_REVIEW` | Minta foto ulang / operator cek |
| Ada potensi B3 | `NEEDS_OPERATOR_REVIEW` | Balasan aman, tidak janji pickup |
| Data lengkap area layanan | `NEW` atau `NEEDS_OPERATOR_REVIEW` | Nomor tiket + tunggu operator |

---

## 4. Template balasan WhatsApp

Gunakan bahasa ramah, singkat, dan tidak teknis.

### 4.1 Minta foto

```text
Baik, kami bisa bantu cek permintaan jemput sampahnya.
Mohon kirim foto sampah dari jarak yang cukup jelas agar operator bisa memperkirakan volume dan jenis armada yang sesuai.
```

### 4.2 Minta alamat/share location

```text
Terima kasih. Mohon kirim alamat lengkap atau share location WhatsApp agar petugas mudah menemukan lokasi.
Untuk tahap awal layanan tersedia di Watang Sawitto dan Paleteang.
```

### 4.3 Tiket diterima

```text
Siap, permintaan jemput sampah sudah kami terima.
Nomor tiket: {ticketCode}

Ringkasan: {summary}

Operator akan mengecek dan mengonfirmasi jadwal penjemputan. Mohon tunggu konfirmasi jadwal terlebih dahulu.
```

### 4.4 Di luar wilayah

```text
Mohon maaf, untuk tahap awal layanan jemput sampah baru tersedia di Watang Sawitto dan Paleteang.
Lokasi Bapak/Ibu bisa kami catat sebagai daftar tunggu pengembangan layanan.
```

### 4.5 Volume besar

```text
Terima kasih, permintaan sudah kami terima.
Nomor tiket: {ticketCode}

Dari foto, volume sampah terlihat cukup banyak sehingga perlu dicek operator untuk penyesuaian armada dan jadwal.
Operator akan menghubungi kembali untuk konfirmasi.
```

### 4.6 Potensi sampah berbahaya

```text
Terima kasih atas informasinya.
Dari foto/pesan yang dikirim, ada kemungkinan sampah perlu penanganan khusus.
Operator akan mengecek terlebih dahulu sebelum memberikan arahan lebih lanjut.
```

### 4.7 Voice note/audio

```text
Mohon maaf, saat ini sistem belum bisa memproses voice note secara otomatis.
Mohon ketik alamat singkat dan kirim foto sampah agar operator bisa membantu lebih cepat.
```

### 4.8 Ubah jadwal

```text
Baik, permintaan ubah jadwal sudah kami terima.
Operator akan mengecek ketersediaan petugas dan mengonfirmasi jadwal baru.
```

### 4.9 Batal jemput

```text
Baik, permintaan pembatalan sudah kami terima.
Operator akan memperbarui status tiket. Terima kasih sudah memberi kabar.
```

---

## 5. Intent tambahan yang perlu didukung

Tambahkan klasifikasi intent:

```ts
type WasteIntent =
  | 'PICKUP_REQUEST'
  | 'REGULAR_SUBSCRIPTION_INQUIRY'
  | 'ASK_PRICE'
  | 'ASK_AREA'
  | 'COMPLAINT'
  | 'CHANGE_SCHEDULE'
  | 'CANCEL_PICKUP'
  | 'CHECK_STATUS'
  | 'THANK_YOU'
  | 'OTHER';
```

Mapping:

- `BATAL`, `cancel`, `tidak jadi` → `CANCEL_PICKUP`
- `ubah jadwal`, `besok saja`, `nanti sore` → `CHANGE_SCHEDULE`
- `sudah sampai mana`, `tiket saya` → `CHECK_STATUS`
- `berapa harga`, `berapa nilainya` → `ASK_PRICE`

Jika `ASK_PRICE`, balasan aman:

```text
Untuk tahap awal, sistem belum menetapkan harga atau nilai per kilogram dari foto.
Jika nanti ada proses timbang atau penilaian, operator akan mengonfirmasi secara langsung sesuai kondisi sampah yang diterima.
```

---

## 6. Conversation window

Satu permintaan warga sering datang bertahap:

1. Pesan teks.
2. Foto.
3. Share location.
4. Tambahan alamat.

Jangan membuat tiket ganda.

Gunakan conversation window:

```ts
const CONVERSATION_WINDOW_MINUTES = 30;
```

Logika:

- Cari tiket `NEEDS_INFO` atau `NEEDS_OPERATOR_REVIEW` dari nomor yang sama dalam 30 menit terakhir.
- Jika ada, update tiket tersebut.
- Jika tidak ada, buat tiket baru jika data cukup.
- Semua pesan tetap disimpan di `whatsappMessages`.

---

## 7. Idempotency WhatsApp

Jangan proses pesan yang sama dua kali.

Gunakan:

```text
idempotencyKeys/{waMessageId}
```

Sebelum proses:

1. Cek `waMessageId`.
2. Jika sudah ada status `PROCESSED`, stop.
3. Jika `PROCESSING` tetapi lease belum expired, stop.
4. Jika belum ada, buat lease.
5. Setelah selesai, tandai `PROCESSED`.

---

## 8. Output AI wajib validasi Zod

Jangan langsung percaya output AI.

Pola:

```ts
const parsed = WasteAiAnalysisSchema.safeParse(modelOutput);

if (!parsed.success) {
  await saveAiFailure({ rawModelOutput: modelOutput, error: parsed.error });
  return fallbackToOperatorReview();
}
```

Fallback aman:

```text
Terima kasih. Permintaan sudah kami terima dan akan dicek operator.
Mohon pastikan alamat dan foto sampah sudah dikirim.
```

---

## 9. UX public web/wizard warga

Jika ada wizard `/pickup/new`, posisikan sebagai alat bantu, bukan kanal utama produksi bila WhatsApp masih kanal resmi.

Wizard ideal 4 langkah:

1. Pilih wilayah.
2. Isi alamat/share lokasi.
3. Upload foto sampah.
4. Review dan kirim via WhatsApp / simpan draft.

Catatan:

- Jika integrasi API publik belum aktif, tombol utama harus jelas: `Lanjutkan via WhatsApp`.
- Jangan memberi kesan tiket resmi sudah masuk jika hanya draft lokal browser.
- Simpan draft lokal boleh, tetapi label harus jelas.

---

## 10. Acceptance criteria WhatsApp/AI/warga

- [ ] Teks tanpa foto meminta foto.
- [ ] Foto tanpa alamat meminta alamat/share location.
- [ ] Voice note mendapat balasan minta teks/foto.
- [ ] Luar wilayah tidak membuat tiket aktif.
- [ ] ASK_PRICE tidak menghasilkan harga/kg/saldo.
- [ ] CHANGE_SCHEDULE masuk antrean operator.
- [ ] CANCEL_PICKUP masuk antrean operator.
- [ ] CHECK_STATUS membalas status sederhana jika nomor tiket ditemukan.
- [ ] Output AI invalid tidak membuat sistem crash.
- [ ] Pesan duplikat tidak membuat tiket ganda.
- [ ] Warga menerima bahasa sederhana tanpa istilah teknis internal.
