export const askAddressTemplate = `
Baik, permintaan jemput sampah bisa kami bantu.

Mohon kirim alamat lengkap atau share location WhatsApp. Untuk tahap awal, layanan tersedia di Watang Sawitto dan Paleteang.
`.trim();

export const askPhotoTemplate = `
Baik, agar kami bisa mengecek perkiraan volumenya, mohon kirim foto sampah dari jarak yang cukup jelas.
`.trim();

export const outOfAreaTemplate = `
Mohon maaf, untuk tahap awal layanan jemput sampah baru tersedia di Watang Sawitto dan Paleteang. Lokasi Bapak/Ibu dapat kami catat untuk pengembangan layanan.
`.trim();

export const safeFallbackTemplate = `
Terima kasih. Permintaan sudah kami terima dan akan dicek operator. Mohon pastikan alamat dan foto sampah sudah dikirim.
`.trim();

export function ticketCreatedTemplate(
  ticketCode: string,
  summary?: string,
): string {
  return [
    'Siap, permintaan jemput sampah sudah kami terima.',
    `Nomor permintaan: ${ticketCode}`,
    summary?.trim(),
    'Operator akan mengonfirmasi jadwal penjemputan.',
  ]
    .filter(Boolean)
    .join('\n\n');
}
