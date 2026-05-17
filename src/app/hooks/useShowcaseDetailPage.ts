import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useData } from '@/stores/useDataStore';
import { type FactoryShowcase } from '@/stores/types';
import { useQuery } from '@tanstack/react-query';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { showcaseKeys } from '@/lib/queryKeys';
import { showcasesApi } from '@/services/api/factoryApi';

function showcaseIdMatches(a: string, b: string): boolean {
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
  product: { acceptTypes: ['product', 'material'] },
  promotion: { acceptTypes: ['promotion'] },
  idea: { acceptTypes: ['idea'] },
};

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
  const viewedIdRef = useRef<string>('');

  const fromContext = useMemo(() => {
    if (!resolvedId) return null;
    return (
      data.factoryShowcases.find(
        (e) => showcaseIdMatches(e.id, resolvedId) && acceptTypes.includes(e.contentType),
      ) ?? null
    );
  }, [data.factoryShowcases, resolvedId, acceptTypes]);

  const shouldFetchDetail = Boolean(resolvedId && !hasRichSections(fromContext));

  const detailQ = useQuery({
    queryKey: showcaseKeys.detail(resolvedId),
    queryFn: async () => {
      const raw = await showcasesApi.get(resolvedId);
      const row = unwrapShowcaseDetailPayload(raw as Record<string, unknown>);
      const s = mapShowcaseFromApi(row);
      if (!s.id || !acceptTypes.includes(s.contentType)) {
        throw new Error('ไม่พบข้อมูลโชว์เคส');
      }
      return s;
    },
    enabled: shouldFetchDetail,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const apiItem = detailQ.data ?? null;
  const fetchLoading = detailQ.isLoading;
  const fetchError =
    detailQ.error instanceof Error
      ? detailQ.error.message
      : detailQ.error
        ? 'โหลดไม่สำเร็จ'
        : null;

  useEffect(() => {
    viewedIdRef.current = '';
  }, [resolvedId]);

  const item = apiItem ?? fromContext;

  const shouldFetchRelated = kind !== 'idea' && Boolean(resolvedId);

  const relatedQ = useQuery({
    queryKey: [...showcaseKeys.detail(resolvedId), 'related', kind],
    queryFn: async () => {
      const detailRaw = await showcasesApi.get(resolvedId).catch(() => ({}));
      const detailRow = unwrapShowcaseDetailPayload((detailRaw as Record<string, unknown>) ?? {});
      const detail = item ?? mapShowcaseFromApi(detailRow);
      const apiTypes: Array<'PD' | 'PM' | 'MT'> = ['PD', 'PM', 'MT'];

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
          buckets.push(...subRows.map(mapShowcaseFromApi));
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
          buckets.push(...catRows.map(mapShowcaseFromApi));
        }
      }

      if (buckets.length === 0) {
        const allLists = await Promise.all(
          apiTypes.map((type) => showcasesApi.listFiltered({ type }).catch(() => [])),
        );
        for (const rawAll of allLists) {
          const allRows = (Array.isArray(rawAll) ? rawAll : []) as Record<string, unknown>[];
          buckets.push(...allRows.map(mapShowcaseFromApi));
        }
      }

      const currentId = detail.id || String(resolvedId);
      const uniq = new Map<string, FactoryShowcase>();
      for (const row of buckets) {
        if (!row.id || row.id === currentId) continue;
        if (
          !(
            row.contentType === 'product' ||
            row.contentType === 'promotion' ||
            row.contentType === 'material'
          )
        ) {
          continue;
        }
        if (!uniq.has(row.id)) uniq.set(row.id, row);
      }
      return [...uniq.values()].slice(0, 8);
    },
    enabled: shouldFetchRelated && Boolean(resolvedId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const relatedApiShowcases = relatedQ.data ?? [];

  const relatedShowcases = useMemo(() => {
    if (!item || kind === 'idea') return [] as FactoryShowcase[];
    const allByType = data.factoryShowcases.filter(
      (s) =>
        (s.contentType === 'product' ||
          s.contentType === 'promotion' ||
          s.contentType === 'material') &&
        s.id !== item.id,
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
  const error = fetchError || null;
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
    isMaterial: base.item?.contentType === 'material',
  };
}

export function usePromotionDetailShowcase() {
  return useShowcaseDetailPage('promotion');
}

export function useIdeaDetailShowcase() {
  return useShowcaseDetailPage('idea');
}
