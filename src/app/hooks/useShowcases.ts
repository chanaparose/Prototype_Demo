/**
 * useShowcases — Load showcases from GET /showcases (API spec §7, new_api_specs_for_fe.md)
 *
 * Optional `type` uses server filter: PD | PM | ID. Omit for full list (ทั้งหมด).
 */
import { useState, useEffect, useMemo } from 'react';
import { showcasesApi } from '../services/api';
import type { FactoryShowcase } from '../contexts/DataContext';

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

export function normShowcase(r: Record<string, unknown>): FactoryShowcase {
  const leadRaw = r.lead_time ?? r.leadTime ?? r.lead_time_days;
  const leadTime =
    leadRaw != null && leadRaw !== ''
      ? String(leadRaw)
      : '';

  const catIdRaw = r.category_id ?? r.categoryId;
  const categoryId =
    catIdRaw != null && String(catIdRaw).trim() !== ''
      ? String(catIdRaw).trim()
      : undefined;

  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    factoryId: String(r.factory_id ?? r.factoryId ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    image: String(r.image_url ?? r.image ?? ''),
    contentType: CT_MAP[String(r.content_type ?? '').trim()] ?? 'product',
    category: String(r.category_name ?? r.category ?? ''),
    categoryId,
    postedAt: String(r.created_at ?? r.postedAt ?? ''),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
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
