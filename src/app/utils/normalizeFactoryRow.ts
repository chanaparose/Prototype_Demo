import type { Factory } from '@/stores';

export function pickFactoryCoverUrl(row: Record<string, unknown>): string {
  return String(
    row.background_image_url ??
      row.cover_image_url ??
      row.banner_url ??
      row.hero_image_url ??
      row.cover_url ??
      '',
  ).trim();
}

function pickFactoryAvatarUrl(row: Record<string, unknown>): string {
  return String(row.image_url ?? row.image ?? row.logo_url ?? '').trim();
}

/** แปลงแถวโรงงานจาก API (bootstrap / frontend/factories ฯลฯ) → รูปแบบ Factory ของแอป */
export function normalizeFactoryRow(row: Record<string, unknown>, idFallback = ''): Factory {
  const id = String(row.id ?? row.factory_id ?? idFallback);
  const ftn = String(row.factory_type_name ?? row.factoryTypeName ?? '').trim();
  const coverImageUrl = pickFactoryCoverUrl(row);
  let image = pickFactoryAvatarUrl(row);
  if (!image && coverImageUrl) image = coverImageUrl;
  const provinceName = String(row.province_name ?? row.provinceName ?? '').trim();
  return {
    id,
    name: String(row.name ?? row.factory_name ?? ''),
    location: provinceName || String(row.location ?? row.city ?? ''),
    rating: Number(row.avg_rating ?? row.rating ?? 0),
    reviews: Number(row.review_count ?? row.reviews ?? 0),
    specialization: String(row.specialization ?? row.description ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    minOrder: Number(row.min_order ?? row.minOrder ?? 0),
    leadTime: String(row.lead_time ?? row.leadTime ?? ''),
    image,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    verified: Boolean(row.is_verified ?? row.verified ?? false),
    completedOrders: Number(row.completed_orders ?? row.completedOrders ?? 0),
    priceRange: String(row.price_range ?? row.priceRange ?? ''),
    ...(ftn ? { factoryTypeName: ftn } : {}),
    ...(provinceName ? { provinceName } : {}),
  };
}
