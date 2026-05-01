import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useData } from '../contexts/DataContext';
import type { FactoryShowcase } from '../contexts/DataContext';
import { showcasesApi } from '../services/api';
import { normShowcase } from './useShowcases';

export function showcaseIdMatches(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') return na === nb;
  return false;
}

type ShowcaseContentType = FactoryShowcase['contentType'];

const PAGE_CONFIG: Record<
  'product' | 'promotion' | 'idea',
  { acceptTypes: ShowcaseContentType[] }
> = {
  product: { acceptTypes: ['product'] },
  promotion: { acceptTypes: ['promotion'] },
  idea: { acceptTypes: ['idea'] },
};

/** แปลง payload GET /showcases/:id เป็นแถวเดียวสำหรับ normShowcase */
function unwrapShowcaseDetailPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = raw.showcase;
  if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
  const data = raw.data;
  if (data && typeof data === 'object' && ('showcase_id' in data || 'id' in data)) {
    return data as Record<string, unknown>;
  }
  return raw;
}

function hasRichSections(c: FactoryShowcase | null | undefined): boolean {
  return Boolean(c?.sections && Array.isArray(c.sections) && c.sections.length > 0);
}

function useShowcaseDetailPage(kind: 'product' | 'promotion' | 'idea') {
  const { acceptTypes } = PAGE_CONFIG[kind];
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const qId = searchParams.get('showcase_id');
  const resolvedId = (pathId && pathId.trim() !== '' ? pathId : qId)?.trim() ?? '';

  const data = useData();
  const [apiItem, setApiItem] = useState<FactoryShowcase | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [relatedApiShowcases, setRelatedApiShowcases] = useState<FactoryShowcase[]>([]);
  const viewedIdRef = useRef<string>('');

  const fromContext = useMemo(() => {
    if (!resolvedId) return null;
    return (
      data.factoryShowcases.find(
        (e) => showcaseIdMatches(e.id, resolvedId) && acceptTypes.includes(e.contentType),
      ) ?? null
    );
  }, [data.factoryShowcases, resolvedId, acceptTypes]);

  useEffect(() => {
    viewedIdRef.current = '';
  }, [resolvedId]);

  useEffect(() => {
    if (!resolvedId) {
      setApiItem(null);
      setFetchLoading(false);
      setFetchError(null);
      return;
    }

    if (hasRichSections(fromContext)) {
      setApiItem(null);
      setFetchLoading(false);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setFetchLoading(true);
    setFetchError(null);
    setApiItem(null);

    void (async () => {
      try {
        const raw = await showcasesApi.get(resolvedId);
        if (cancelled) return;
        const row = unwrapShowcaseDetailPayload(raw as Record<string, unknown>);
        const s = normShowcase(row);
        if (!s.id || !acceptTypes.includes(s.contentType)) {
          setFetchError('ไม่พบข้อมูลโชว์เคส');
          setApiItem(null);
        } else {
          setApiItem(s);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
          setApiItem(null);
        }
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedId, fromContext, acceptTypes]);

  const item = apiItem ?? fromContext;
  useEffect(() => {
    if (kind === 'idea' || !resolvedId) {
      setRelatedApiShowcases([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        // Guarantee related API requests even when context is sparse.
        const detailRaw = await showcasesApi.get(resolvedId).catch(() => ({}));
        const detailRow = unwrapShowcaseDetailPayload((detailRaw as Record<string, unknown>) ?? {});
        const detail = item ?? normShowcase(detailRow);
        const apiTypes: Array<'PD' | 'PM'> = ['PD', 'PM'];

        const subIdFromDetail = detail.sub_category_id ?? Number(detailRow.sub_category_id ?? NaN);
        const catIdFromDetail =
          detail.categoryId != null && String(detail.categoryId).trim() !== ''
            ? Number(detail.categoryId)
            : Number(detailRow.category_id ?? NaN);

        const buckets: FactoryShowcase[] = [];

        if (Number.isFinite(Number(subIdFromDetail)) && Number(subIdFromDetail) > 0) {
          const subLists = await Promise.all(
            apiTypes.map((type) =>
              showcasesApi
                .listFiltered({ type, sub_category_id: Number(subIdFromDetail) })
                .catch(() => []),
            ),
          );
          for (const rawSub of subLists) {
            const subRows = (Array.isArray(rawSub) ? rawSub : []) as Record<string, unknown>[];
            buckets.push(...subRows.map(normShowcase));
          }
        }

        if (Number.isFinite(Number(catIdFromDetail)) && Number(catIdFromDetail) > 0) {
          const catLists = await Promise.all(
            apiTypes.map((type) =>
              showcasesApi
                .listFiltered({ type, category_id: Number(catIdFromDetail) })
                .catch(() => []),
            ),
          );
          for (const rawCat of catLists) {
            const catRows = (Array.isArray(rawCat) ? rawCat : []) as Record<string, unknown>[];
            buckets.push(...catRows.map(normShowcase));
          }
        }

        if (buckets.length === 0) {
          const allLists = await Promise.all(
            apiTypes.map((type) => showcasesApi.listFiltered({ type }).catch(() => [])),
          );
          for (const rawAll of allLists) {
            const allRows = (Array.isArray(rawAll) ? rawAll : []) as Record<string, unknown>[];
            buckets.push(...allRows.map(normShowcase));
          }
        }

        const currentId = detail.id || String(resolvedId);
        const uniq = new Map<string, FactoryShowcase>();
        for (const row of buckets) {
          if (!row.id || row.id === currentId) continue;
          if (!(row.contentType === 'product' || row.contentType === 'promotion')) continue;
          if (!uniq.has(row.id)) uniq.set(row.id, row);
        }
        if (!cancelled) setRelatedApiShowcases([...uniq.values()].slice(0, 8));
      } catch {
        if (!cancelled) setRelatedApiShowcases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, resolvedId, item]);

  const relatedShowcases = useMemo(() => {
    if (!item || kind === 'idea') return [] as FactoryShowcase[];
    const allByType = data.factoryShowcases.filter(
      (s) => (s.contentType === 'product' || s.contentType === 'promotion') && s.id !== item.id,
    );
    const sameSub = allByType.filter((s) => {
      if (item.sub_category_id == null || s.sub_category_id == null) return false;
      return Number(s.sub_category_id) === Number(item.sub_category_id);
    });
    const sameCategory = allByType.filter((s) => {
      const a = String(item.categoryId ?? item.category ?? '').trim();
      const b = String(s.categoryId ?? s.category ?? '').trim();
      return a !== '' && b !== '' && a === b;
    });
    const merged = [...sameSub, ...sameCategory, ...allByType, ...relatedApiShowcases];
    const uniq = new Map<string, FactoryShowcase>();
    for (const s of merged) {
      if (!uniq.has(s.id)) uniq.set(s.id, s);
    }
    return [...uniq.values()].slice(0, 8);
  }, [data.factoryShowcases, item, kind, relatedApiShowcases]);

  useEffect(() => {
    if (!resolvedId || !item) return;
    const ready = apiItem != null || hasRichSections(fromContext);
    if (!ready) return;
    if (viewedIdRef.current === resolvedId) return;
    viewedIdRef.current = resolvedId;
    void showcasesApi.incrementView(resolvedId).catch(() => {});
  }, [resolvedId, item, apiItem, fromContext]);

  const loading = Boolean(resolvedId && !item && fetchLoading);
  const error = fetchError;
  const factory = item ? data.factories.find((f) => showcaseIdMatches(f.id, item.factoryId)) : null;

  return {
    resolvedId,
    item,
    loading,
    error,
    factory,
    relatedShowcases,
    relatedProducts: kind === 'product' ? relatedShowcases : ([] as FactoryShowcase[]),
  };
}

export function useProductDetailShowcase() {
  const base = useShowcaseDetailPage('product');
  return {
    ...base,
    isIdea: base.item?.contentType === 'idea',
  };
}

export function usePromotionDetailShowcase() {
  return useShowcaseDetailPage('promotion');
}

export function useIdeaDetailShowcase() {
  return useShowcaseDetailPage('idea');
}
