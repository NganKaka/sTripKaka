export type Region = 'north' | 'central' | 'south';

export const REGION_LABELS: Record<Region, string> = {
  north: 'Miền Bắc',
  central: 'Miền Trung',
  south: 'Miền Nam',
};

export const REGION_ORDER: Region[] = ['north', 'central', 'south'];

const PROVINCE_BY_LOCATION: Record<string, string> = {
  phu_quoc: 'Kien Giang',
  hue: 'Hue',
};

const REGION_BY_PROVINCE: Record<string, Region> = {
  'Kien Giang': 'south',
  Hue: 'central',
};

export function regionForLocation(id: string): Region | null {
  const province = PROVINCE_BY_LOCATION[id];
  if (!province) return null;
  return REGION_BY_PROVINCE[province] ?? null;
}
