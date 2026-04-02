/**
 * useShowcases — Page-level hook to load showcases from API
 *
 * Replaces data.factoryShowcases from DataContext.
 * Each page that needs showcases calls this hook to load only what it needs.
 */
import { useState, useEffect, useMemo } from 'react';
import { showcasesApi } from '../services/api';
import type { FactoryShowcase } from '../contexts/DataContext';

// ─── Normaliser (snake_case API → camelCase) ──────────────────
const CT_MAP: Record<string, 'product' | 'promotion' | 'idea'> = {
  PR: 'product', PM: 'promotion', ID: 'idea',
  product: 'product', promotion: 'promotion', idea: 'idea',
};

export function normShowcase(r: Record<string, unknown>): FactoryShowcase {
  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    factoryId: String(r.factory_id ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    image: String(r.image_url ?? r.image ?? ''),
    contentType: CT_MAP[String(r.content_type ?? '')] ?? 'product',
    category: String(r.category_name ?? r.category ?? ''),
    postedAt: String(r.created_at ?? r.postedAt ?? ''),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime: String(r.lead_time ?? r.leadTime ?? ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
  };
}

// Simple in-memory cache to avoid re-fetching on quick page navigations
let cachedShowcases: FactoryShowcase[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

export function useShowcases() {
  const [showcases, setShowcases] = useState<FactoryShowcase[]>(cachedShowcases ?? []);
  const [loading, setLoading] = useState(!cachedShowcases);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use cache if fresh
    if (cachedShowcases && Date.now() - cacheTimestamp < CACHE_TTL) {
      setShowcases(cachedShowcases);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    showcasesApi.list()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const result = arr.map(normShowcase).filter((s) => s.id && s.title);
        cachedShowcases = result;
        cacheTimestamp = Date.now();
        setShowcases(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setShowcases([]);
        setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { showcases, loading, error };
}

/**
 * useShowcaseById — Find a single showcase by ID
 * Loads all showcases (with cache) then filters.
 */
export function useShowcaseById(id: string | undefined, contentType?: string) {
  const { showcases, loading, error } = useShowcases();

  const item = useMemo(() => {
    if (!id) return null;
    return showcases.find((s) => {
      if (s.id !== id) return false;
      if (contentType && s.contentType !== contentType) return false;
      return true;
    }) ?? null;
  }, [showcases, id, contentType]);

  return { item, loading, error };
}
