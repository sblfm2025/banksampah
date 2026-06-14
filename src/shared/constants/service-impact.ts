export const SERVICE_CATEGORIES = [
  'warga',
  'umkm',
  'kantor',
  'sekolah',
  'event',
  'tps3r',
  'csr',
  'internal',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  warga: 'Warga/Rumah tangga',
  umkm: 'UMKM/Toko',
  kantor: 'Kantor',
  sekolah: 'Sekolah',
  event: 'Event/Hajatan',
  tps3r: 'TPS3R',
  csr: 'CSR/Mitra',
  internal: 'Internal Yayasan',
};

export const SERVICE_MODELS = [
  'gratis',
  'berbayar',
  'subsidi',
  'sedekah',
  'csr',
  'kemitraan',
] as const;

export type ServiceModel = (typeof SERVICE_MODELS)[number];

export const SERVICE_MODEL_LABELS: Record<ServiceModel, string> = {
  gratis: 'Gratis',
  berbayar: 'Berbayar',
  subsidi: 'Subsidi',
  sedekah: 'Sedekah',
  csr: 'CSR',
  kemitraan: 'Kemitraan',
};

export const PAYMENT_STATUSES = [
  'gratis',
  'belum_ditagih',
  'menunggu_pembayaran',
  'dp',
  'lunas',
  'subsidi',
  'csr',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  gratis: 'Gratis',
  belum_ditagih: 'Belum ditagih',
  menunggu_pembayaran: 'Menunggu pembayaran',
  dp: 'DP',
  lunas: 'Lunas',
  subsidi: 'Subsidi',
  csr: 'CSR',
};

export const DATA_QUALITY_LEVELS = [
  'estimated_by_user',
  'estimated_by_operator',
  'confirmed_by_driver',
  'weighed',
  'audited',
] as const;

export type DataQuality = (typeof DATA_QUALITY_LEVELS)[number];

export const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  estimated_by_user: 'Estimasi warga',
  estimated_by_operator: 'Estimasi operator',
  confirmed_by_driver: 'Dikonfirmasi petugas',
  weighed: 'Ditimbang',
  audited: 'Diaudit',
};

export const PARTNER_DESTINATIONS = [
  'bank_sampah_peduli_pinrang',
  'tps3r_paleteang_bersinar',
  'tps3r_lain',
  'pengepul',
  'kompos_maggot',
  'residu',
] as const;

export type PartnerDestination = (typeof PARTNER_DESTINATIONS)[number];

export const PARTNER_DESTINATION_LABELS: Record<PartnerDestination, string> = {
  bank_sampah_peduli_pinrang: 'Bank Sampah Peduli Pinrang',
  tps3r_paleteang_bersinar: 'TPS3R Paleteang Bersinar',
  tps3r_lain: 'TPS3R Mitra Lainnya',
  pengepul: 'Pengepul',
  kompos_maggot: 'Kompos/Maggot',
  residu: 'Residu',
};

export const IMPACT_TAGS = [
  'pengurangan_sampah',
  'edukasi',
  'sedekah_sampah',
  'layanan_profesional',
  'lapangan_kerja',
  'tps3r_support',
  'bank_sampah',
] as const;

export type ImpactTag = (typeof IMPACT_TAGS)[number];

export const IMPACT_TAG_LABELS: Record<ImpactTag, string> = {
  pengurangan_sampah: 'Pengurangan sampah',
  edukasi: 'Edukasi',
  sedekah_sampah: 'Sedekah sampah',
  layanan_profesional: 'Layanan profesional',
  lapangan_kerja: 'Lapangan kerja',
  tps3r_support: 'Dukungan TPS3R',
  bank_sampah: 'Bank sampah',
};
