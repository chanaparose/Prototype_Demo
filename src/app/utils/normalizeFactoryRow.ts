import type { Factory } from '../contexts/DataContext';

/** แปลงแถวโรงงานจาก API (bootstrap / frontend/factories ฯลฯ) → รูปแบบ Factory ของแอป */
export function normalizeFactoryRow(row: Record<string, unknown>, idFallback = ''): Factory {
  const id = String(row.id ?? row.factory_id ?? idFallback);
  const ftn = String(row.factory_type_name ?? row.factoryTypeName ?? '').trim();
  return {
    id,
    name: String(row.name ?? row.factory_name ?? ''),
    location: String(row.province_name ?? row.location ?? row.city ?? ''),
    rating: Number(row.avg_rating ?? row.rating ?? 0),
    reviews: Number(row.review_count ?? row.reviews ?? 0),
    specialization: String(row.specialization ?? row.description ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    minOrder: Number(row.min_order ?? row.minOrder ?? 0),
    leadTime: String(row.lead_time ?? row.leadTime ?? ''),
    image: String(row.image_url ?? row.image ?? row.logo_url ?? row.cover_url ?? ''),
    verified: Boolean(row.is_verified ?? row.verified ?? false),
    completedOrders: Number(row.completed_orders ?? row.completedOrders ?? 0),
    priceRange: String(row.price_range ?? row.priceRange ?? ''),
    ...(ftn ? { factoryTypeName: ftn } : {}),
  };
}
