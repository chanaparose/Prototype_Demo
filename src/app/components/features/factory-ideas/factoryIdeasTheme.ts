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

/** Matches FactoryIdeasViewModeToggle width (2×w-7 + gap + padding). */
export const factoryIdeasToolbarTrailingWidthClass = 'w-[3.875rem]';

/** Unified mobile filter toolbar — flat on sticky bar (no outer card frame). */
export const factoryIdeasToolbarCardClass = 'overflow-visible flex flex-col gap-1.5';

/** Header + tabs chrome — tinted top fading into white content. */
export const factoryIdeasChromeGradientClass =
  'bg-gradient-to-b from-brand-purple/[0.09] via-[var(--brand-page)] via-[42%] to-white';

/** Main list surface below chrome. */
export const factoryIdeasContentSurfaceClass = 'bg-white';

/** Type tabs on mobile — continues header fade into white. */
export const factoryIdeasTypeTabsChromeClass =
  'border-b border-slate-200/50 bg-gradient-to-b from-transparent via-white/75 to-white';

export const factoryIdeasFilterButtonSizeClass =
  'h-8 px-2.5 text-[12px] font-medium';

export const factoryIdeasFilterButtonIdleClass =
  'border-gray-200/80 bg-white text-slate-700 hover:border-gray-300 active:bg-gray-50/80';

export const factoryIdeasFilterButtonActiveClass =
  'border-brand-purple/30 bg-brand-lavender-chip/75 text-brand-violet-deep';

export function factoryIdeasFilterButtonClass(active: boolean): string {
  return active ? factoryIdeasFilterButtonActiveClass : factoryIdeasFilterButtonIdleClass;
}

/** Search + view toggle row — visible but lighter than primary filter dropdowns. */
export const factoryIdeasToolbarSecondarySurfaceClass =
  'rounded-lg border border-gray-200/80 bg-white';

/** Plain-text preview for list cards — strips markdown markers, keeps full width for line-clamp. */
export function factoryIdeasExcerptPreview(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** List-card excerpt — drops title duplicate and empty tails so the card stays scannable. */
export function factoryIdeasListExcerpt(title: string, raw?: string | null): string | null {
  if (!raw?.trim()) return null;

  let text = factoryIdeasExcerptPreview(raw);
  const normalizedTitle = title.trim();

  if (text.startsWith(normalizedTitle)) {
    text = text.slice(normalizedTitle.length).replace(/^[\s.,:;|–—-]+/, '').trim();
  }

  if (!text || text.length < 6 || text === normalizedTitle) return null;
  return text;
}

export type FactoryIdeasContentType =
  | 'all'
  | 'product'
  | 'promotion'
  | 'idea'
  | 'material'
  | 'factory';

export const factoryIdeasContentTypes: { id: FactoryIdeasContentType; label: string }[] = [
  { id: 'product', label: 'สินค้า' },
  // { id: 'promotion', label: 'โปรโมชัน' }, // PM disabled
  { id: 'material', label: 'วัตถุดิบ' },
  { id: 'idea', label: 'ไอเดีย' },
  { id: 'factory', label: 'โรงงาน' },
];

export function getDefaultFactoryIdeasContentType(
  hubScope?: 'PD' | 'MT',
): Exclude<FactoryIdeasContentType, 'all'> {
  if (hubScope === 'MT') return 'material';
  return 'product';
}

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

export function factoryIdeasSearchPlaceholder(type: FactoryIdeasContentType): string {
  if (type === 'all') return 'ค้นหาในแท็บนี้…';
  return `ค้นหา${factoryIdeasContentTypeLabel[type]}ในแท็บนี้…`;
}

/** Secondary search — de-emphasized vs category/MOQ dropdowns on mobile toolbar. */
export function factoryIdeasSecondarySearchPlaceholder(type: FactoryIdeasContentType): string {
  if (type === 'all') return 'ค้นหาเพิ่มเติม…';
  return `ค้นหา${factoryIdeasContentTypeLabel[type]}เพิ่มเติม…`;
}

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
