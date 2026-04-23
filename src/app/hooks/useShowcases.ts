/**
 * useShowcases — Load showcases from GET /showcases (API spec §7, new_api_specs_for_fe.md)
 *
 * Optional `type` uses server filter: PD | PM | ID. Omit for full list (ทั้งหมด).
 */
import { useState, useEffect, useMemo } from 'react';
import { showcasesApi } from '../services/api';
import type { FactoryShowcase, ShowcaseImageRow, ShowcaseSpecRow } from '../contexts/DataContext';

export type ShowcaseApiType = 'PD' | 'PM' | 'ID';

/** Maps API `content_type` (and legacy codes) → UI contentType */
const CT_MAP: Record<string, 'product' | 'promotion' | 'idea'> = {
  PD: 'product',
  PR: 'product',
  PM: 'promotion',
  ID: 'idea',
  product: 'product',
  promotion: 'promotion',
  idea: 'idea',
};

function parseImageUrls(raw: unknown): string[] {
  const src = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.trim().startsWith('[')
      ? (() => {
          try {
            const p = JSON.parse(raw) as unknown;
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
  return src
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const row = item as Record<string, unknown>;
      return String(row.url ?? row.image_url ?? row.public_url ?? '').trim();
    })
    .filter((u) => u !== '')
    .slice(0, 5);
}

export function normShowcase(r: Record<string, unknown>): FactoryShowcase {
  const leadRaw = r.lead_time ?? r.leadTime ?? r.lead_time_days;
  const leadTime =
    leadRaw != null && leadRaw !== ''
      ? String(leadRaw)
      : '';
  const imageUrls = parseImageUrls(r.images ?? r.image_urls ?? r.imageUrls);
  const firstImage = imageUrls[0] ?? String(r.image_url ?? r.image ?? '').trim();

  const catIdRaw = r.category_id ?? r.categoryId;
  const categoryId =
    catIdRaw != null && String(catIdRaw).trim() !== ''
      ? String(catIdRaw).trim()
      : undefined;

  const subRaw = r.sub_category_id ?? r.subCategoryId;
  let sub_category_id: number | undefined;
  if (subRaw != null && String(subRaw).trim() !== '') {
    const n = Number(subRaw);
    if (Number.isFinite(n)) sub_category_id = n;
  }
  const subNameRaw = r.sub_category_name ?? r.subCategoryName;
  const sub_category_name =
    subNameRaw != null && String(subNameRaw).trim() !== ''
      ? String(subNameRaw)
      : null;

  const factoryImageUrl = String(r.factory_image_url ?? r.factoryImageUrl ?? '').trim();
  const fr = r.factory_rating ?? r.factoryRating;
  const factoryRating =
    fr != null && String(fr).trim() !== '' && Number.isFinite(Number(fr)) ? Number(fr) : undefined;
  const factoryVerified = Boolean(r.factory_verified ?? r.factoryVerified);

  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    factoryId: String(r.factory_id ?? r.factoryId ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    image: firstImage,
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
    contentType: CT_MAP[String(r.type ?? r.content_type ?? '').trim()] ?? 'product',
    category: String(r.category_name ?? r.category ?? ''),
    categoryId,
    sub_category_id,
    sub_category_name,
    postedAt: String(r.created_at ?? r.postedAt ?? ''),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.moq ?? r.min_order ?? r.minOrder ?? 0),
    leadTime,
    ...(r.content != null && String(r.content).trim() !== '' ? { content: String(r.content) } : {}),
    ...(r.base_price != null && Number.isFinite(Number(r.base_price))
      ? { basePrice: Number(r.base_price) }
      : {}),
    ...(r.promo_price != null && Number.isFinite(Number(r.promo_price))
      ? { promoPrice: Number(r.promo_price) }
      : {}),
    ...(r.production_capacity != null && Number.isFinite(Number(r.production_capacity))
      ? { productionCapacity: Number(r.production_capacity) }
      : {}),
    ...(r.sample_available != null ? { sampleAvailable: Boolean(r.sample_available) } : {}),
    ...(r.start_date != null && String(r.start_date).trim() !== '' ? { startDate: String(r.start_date) } : {}),
    ...(r.end_date != null && String(r.end_date).trim() !== '' ? { endDate: String(r.end_date) } : {}),
    ...(r.status != null && String(r.status).trim() !== '' ? { status: String(r.status) } : {}),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    ...(factoryImageUrl ? { factoryImageUrl } : {}),
    ...(factoryRating != null ? { factoryRating } : {}),
    ...(factoryVerified ? { factoryVerified } : {}),
    ...(r.description != null && String(r.description).trim() !== '' ? { description: String(r.description) } : {}),
    ...(r.price_range != null && String(r.price_range).trim() !== ''
      ? { priceRange: String(r.price_range) }
      : r.priceRange != null && String(r.priceRange).trim() !== ''
        ? { priceRange: String(r.priceRange) }
        : {}),
    ...(Array.isArray(r.sections) && r.sections.length > 0
      ? { sections: r.sections as import('../contexts/DataContext').ShowcaseSection[] }
      : {}),
    ...(Array.isArray(r.images) && r.images.length > 0
      ? { images: r.images as ShowcaseImageRow[] }
      : {}),
    ...(Array.isArray(r.specs) && r.specs.length > 0
      ? {
          specs: (r.specs as Record<string, unknown>[]).map((sp) => ({
            spec_key: String(sp.spec_key ?? ''),
            spec_value: String(sp.spec_value ?? ''),
            sort_order: Number(sp.sort_order ?? 0),
          })) as ShowcaseSpecRow[],
        }
      : {}),
  };
}

type CacheEntry = { data: FactoryShowcase[]; ts: number };
const cacheByKey = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000;

function cacheKey(type: ShowcaseApiType | undefined) {
  return type ?? 'ALL';
}

/** Map Factory Ideas UI tab → `GET /showcases` query `type` (PD / PM / ID) */
export function showcaseQueryTypeFromTab(
  tab: 'all' | 'product' | 'promotion' | 'idea' | 'factory',
): ShowcaseApiType | undefined {
  if (tab === 'all' || tab === 'factory') return undefined;
  if (tab === 'product') return 'PD';
  if (tab === 'promotion') return 'PM';
  return 'ID';
}

function readCache(key: string): FactoryShowcase[] | null {
  const c = cacheByKey.get(key);
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data;
  return null;
}

export function useShowcases(options?: { type?: ShowcaseApiType }) {
  const type = options?.type;
  const key = cacheKey(type);

  const [showcases, setShowcases] = useState<FactoryShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache(key);
    if (cached) {
      setShowcases(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setShowcases([]);

    showcasesApi
      .list(type)
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const result = arr.map(normShowcase).filter((s) => s.id && s.title);
        cacheByKey.set(key, { data: result, ts: Date.now() });
        setShowcases(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setShowcases([]);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, type]);

  return { showcases, loading, error };
}

/**
 * useShowcaseById — Find one showcase (loads full list via GET /showcases, no type filter)
 */
export function useShowcaseById(id: string | undefined, contentType?: string) {
  const { showcases, loading, error } = useShowcases();

  const item = useMemo(() => {
    if (!id) return null;
    return (
      showcases.find((s) => {
        if (s.id !== id) return false;
        if (contentType && s.contentType !== contentType) return false;
        return true;
      }) ?? null
    );
  }, [showcases, id, contentType]);

  return { item, loading, error };
}
