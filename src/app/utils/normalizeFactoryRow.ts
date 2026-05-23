import { type Factory } from '@/stores/types';
import type { ApiRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export function pickFactoryCoverUrl(row: ApiRecord): string {
  return pickScalarString(
    row.background_image_url,
    row.cover_image_url,
    row.banner_url,
    row.hero_image_url,
    row.cover_url,
  );
}

function pickFactoryAvatarUrl(row: ApiRecord): string {
  return pickScalarString(row.image_url, row.image, row.logo_url);
}

export function normalizeFactoryRow(row: ApiRecord, idFallback = ''): Factory {
  const id = pickScalarString(row.id, row.factory_id, idFallback);
  const ftn = pickScalarString(row.factory_type_name, row.factoryTypeName);
  const coverImageUrl = pickFactoryCoverUrl(row);
  let image = pickFactoryAvatarUrl(row);
  if (!image && coverImageUrl) image = coverImageUrl;
  const provinceName = pickScalarString(row.province_name, row.provinceName);
  return {
    id,
    name: pickScalarString(row.name, row.factory_name),
    location: provinceName || pickScalarString(row.location, row.city),
    rating: pickScalarNumber(row.avg_rating, row.rating) ?? 0,
    reviews: pickScalarNumber(row.review_count, row.reviews) ?? 0,
    specialization: pickScalarString(row.specialization, row.description),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    minOrder: pickScalarNumber(row.min_order, row.minOrder) ?? 0,
    leadTime: pickScalarString(row.lead_time, row.leadTime),
    image,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    verified: Boolean(row.is_verified ?? row.verified ?? false),
    completedOrders: pickScalarNumber(row.completed_orders, row.completedOrders) ?? 0,
    priceRange: pickScalarString(row.price_range, row.priceRange),
    ...(ftn ? { factoryTypeName: ftn } : {}),
    ...(provinceName ? { provinceName } : {}),
  };
}
