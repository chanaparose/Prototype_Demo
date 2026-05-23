import { asRecord } from '@/lib/apiShape';
import { type Factory } from '@/stores/types';
import { pickScalarString } from '@/utils/pickScalarString';

export const factoryIdeasTheme = {
  purple: 'var(--brand-mauve)',
  purpleLight: '#9D77B2',
  orange: 'var(--brand-orange-deep)',
  blue: 'var(--brand-navy)',
  productBadgeBlue: '#2563EB',
  white: 'var(--neutral-white)',
  gray: 'var(--neutral-warm-surface)',
  lightPurpleBg: 'var(--brand-page)',
  teal: 'var(--brand-teal)',
} as const;

export type FactoryIdeasContentType =
  | 'all'
  | 'product'
  | 'promotion'
  | 'idea'
  | 'material'
  | 'factory';

export const factoryIdeasContentTypes: { id: FactoryIdeasContentType; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'product', label: 'สินค้า' },
  { id: 'promotion', label: 'โปรโมชัน' },
  { id: 'material', label: 'วัตถุดิบ' },
  { id: 'idea', label: 'ไอเดีย' },
  { id: 'factory', label: 'โรงงาน' },
];

export const factoryIdeasContentTypeLabel: Record<
  Exclude<FactoryIdeasContentType, 'all'>,
  string
> = {
  product: 'สินค้า',
  promotion: 'โปรโมชัน',
  material: 'วัตถุดิบ',
  idea: 'ไอเดีย',
  factory: 'โรงงาน',
};

export const factoryIdeasContentTypeBadge: Record<
  Exclude<FactoryIdeasContentType, 'all'>,
  string
> = {
  product: factoryIdeasTheme.productBadgeBlue,
  promotion: factoryIdeasTheme.orange,
  material: 'var(--brand-teal-light)',
  idea: factoryIdeasTheme.purple,
  factory: factoryIdeasTheme.teal,
};

export function normalizeFactoryIdeaFactory(raw: unknown): Factory {
  const r = asRecord(raw);
  const provinceName = pickScalarString(r.province_name, r.provinceName);
  return {
    id: pickScalarString(r.factory_id, r.id),
    name: pickScalarString(r.factory_name, r.name),
    image: pickScalarString(r.image_url, r.image, r.logo_url),
    location: provinceName || pickScalarString(r.location, r.city),
    ...(provinceName ? { provinceName } : {}),
    rating: Number(r.avg_rating ?? r.rating ?? 0),
    reviews: Number(r.review_count ?? r.reviews ?? 0),
    specialization: pickScalarString(r.specialization),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime: pickScalarString(r.lead_time, r.leadTime),
    verified: Boolean(r.is_verified ?? r.verified ?? false),
    completedOrders: Number(r.completed_orders ?? r.completedOrders ?? 0),
    priceRange: pickScalarString(r.price_range, r.priceRange),
  };
}

export function getFactoryIdeaDetailPath(type: string, id: string) {
  const q = encodeURIComponent(id);
  if (type === 'product') return `/product-detail?showcase_id=${q}`;
  if (type === 'material') return `/product-detail?showcase_id=${q}`;
  if (type === 'promotion') return `/promotion-detail?showcase_id=${q}`;
  return `/idea-detail?showcase_id=${q}`;
}
