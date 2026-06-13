import type {
  ActiveDistrict,
  ServiceDistrict,
  ServiceVillage,
} from './region.types';

export const SERVICE_DISTRICTS: readonly ServiceDistrict[] = [
  {
    id: 'WATANG_SAWITTO',
    slug: 'watang-sawitto',
    name: 'Watang Sawitto',
    aliases: ['Watang Sawitto', 'Watang Sawito'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'PALETEANG',
    slug: 'paleteang',
    name: 'Paleteang',
    aliases: ['Paleteang'],
    isActive: true,
    sortOrder: 2,
  },
] as const;

export const SERVICE_VILLAGES: readonly ServiceVillage[] = [
  { id: 'siparappe', districtId: 'WATANG_SAWITTO', name: 'Siparappe', aliases: [], isActive: true, sortOrder: 1 },
  { id: 'sipatokkong', districtId: 'WATANG_SAWITTO', name: 'Sipatokkong', aliases: [], isActive: true, sortOrder: 2 },
  { id: 'salo', districtId: 'WATANG_SAWITTO', name: 'Salo', aliases: [], isActive: true, sortOrder: 3 },
  { id: 'penrang', districtId: 'WATANG_SAWITTO', name: 'Penrang', aliases: [], isActive: true, sortOrder: 4 },
  { id: 'jaya', districtId: 'WATANG_SAWITTO', name: 'Jaya', aliases: [], isActive: true, sortOrder: 5 },
  { id: 'sawitto', districtId: 'WATANG_SAWITTO', name: 'Sawitto', aliases: ['Sawito'], isActive: true, sortOrder: 6 },
  { id: 'maccorawalie', districtId: 'WATANG_SAWITTO', name: 'Maccorawalie', aliases: [], isActive: true, sortOrder: 7 },
  { id: 'bentengnge', districtId: 'WATANG_SAWITTO', name: 'Bentengnge', aliases: [], isActive: true, sortOrder: 8 },
  { id: 'benteng-sawitto', districtId: 'PALETEANG', name: 'Benteng Sawitto', aliases: ['Benteng Sawito'], isActive: true, sortOrder: 1 },
  { id: 'laleng-bata', districtId: 'PALETEANG', name: 'Laleng Bata', aliases: [], isActive: true, sortOrder: 2 },
  { id: 'macinnae', districtId: 'PALETEANG', name: 'Macinnae', aliases: [], isActive: true, sortOrder: 3 },
  { id: 'mamminasae', districtId: 'PALETEANG', name: 'Mamminasae', aliases: [], isActive: true, sortOrder: 4 },
  { id: 'pacongang', districtId: 'PALETEANG', name: 'Pacongang', aliases: [], isActive: true, sortOrder: 5 },
  { id: 'temmassarangnge', districtId: 'PALETEANG', name: 'Temmassarangnge', aliases: [], isActive: true, sortOrder: 6 },
] as const;

export function villagesForDistrict(
  districtId: ActiveDistrict,
): ServiceVillage[] {
  return SERVICE_VILLAGES.filter(
    (village) => village.districtId === districtId,
  );
}

export function getVillage(
  villageId: string | undefined,
): ServiceVillage | undefined {
  return SERVICE_VILLAGES.find((village) => village.id === villageId);
}
