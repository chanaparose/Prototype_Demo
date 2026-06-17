import { type Factory } from '@/stores/types';

export const factoryIdeasTheme = {
  purple: 'var(--brand-mauve)',
  purpleLight: '#9D77B2',
  orange: 'var(--brand-orange-deep)',
  blue: 'var(--brand-navy)',
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
  // { id: 'promotion', label: 'โปรโมชัน' }, // PM disabled
  { id: 'material', label: 'วัตถุดิบ' },
  { id: 'idea', label: 'ไอเดีย' },
  { id: 'factory', label: 'โรงงาน' },
];

/** Tabs rendered on /factory-ideas (excludes promotion/PM) */
export const factoryIdeasVisibleContentTypes = factoryIdeasContentTypes;

/** Tab order for horizontal swipe animation on /factory-ideas */
export const factoryIdeasTabOrder: FactoryIdeasContentType[] =
  factoryIdeasVisibleContentTypes.map((t) => t.id);

export const factoryIdeasFactoryScopeOrder = ['all', 'PD', 'MT'] as const;

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
  product: 'var(--brand-orange)',
  promotion: factoryIdeasTheme.orange,
  material: 'var(--status-success)',
  idea: factoryIdeasTheme.purple,
  factory: factoryIdeasTheme.teal,
};

export function normalizeFactoryIdeaFactory(r: Record<string, unknown>): Factory {
  const provinceName = String(r.province_name ?? r.provinceName ?? '').trim();
  return {
    id: String(r.factory_id ?? r.id ?? ''),
    name: String(r.factory_name ?? r.name ?? ''),
    image: String(r.image_url ?? r.image ?? r.logo_url ?? ''),
    location: provinceName || String(r.location ?? r.city ?? ''),
    ...(provinceName ? { provinceName } : {}),
    rating: Number(r.avg_rating ?? r.rating ?? 0),
    reviews: Number(r.review_count ?? r.reviews ?? 0),
    specialization: String(r.specialization ?? ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime: String(r.lead_time ?? r.leadTime ?? ''),
    verified: Boolean(r.is_verified ?? r.verified ?? false),
    completedOrders: Number(r.completed_orders ?? r.completedOrders ?? 0),
    priceRange: String(r.price_range ?? r.priceRange ?? ''),
    categoryScopes: Array.isArray(r.category_scopes) ? r.category_scopes.map(String) : [],
    categoryIds: Array.isArray(r.category_ids)
      ? (r.category_ids as unknown[]).map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [],
  };
}

export function getFactoryIdeaDetailPath(type: string, id: string) {
  const q = encodeURIComponent(id);
  if (type === 'product') return `/product-detail?showcase_id=${q}`;
  if (type === 'material') return `/product-detail?showcase_id=${q}`;
  if (type === 'promotion') return `/promotion-detail?showcase_id=${q}`;
  return `/idea-detail?showcase_id=${q}`;
}
