import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useData } from '@/stores/useDataStore';
import { type Factory, type FactoryShowcase } from '@/stores/types';
import { useQuery } from '@tanstack/react-query';
import {
  mapShowcaseDetailBundle,
  parseGroupedRelatedShowcases,
  type ReviewsData,
} from '@/domain/showcase/mappers/mapShowcaseDetail';
import { showcaseKeys } from '@/lib/queryKeys';
import { showcasesApi } from '@/services/api/factoryApi';

export type { ReviewItem, ReviewsData } from '@/domain/showcase/mappers/mapShowcaseDetail';

function showcaseIdMatches(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') return na === nb;
  return false;
}

function hasRichSections(c: FactoryShowcase | null | undefined): boolean {
  return Boolean(c?.sections && Array.isArray(c.sections) && c.sections.length > 0);
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
      return mapShowcaseDetailBundle(raw, acceptTypes);
    },
    enabled: shouldFetchDetail,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const apiItem = detailQ.data?.showcase ?? null;
  const embeddedFactory = detailQ.data?.factory ?? null;
  const embeddedReviews = detailQ.data?.reviews ?? null;
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
    queryKey: showcaseKeys.relatedForDetail(resolvedId, kind),
    queryFn: async () => {
      if (!item) return [] as FactoryShowcase[];
      const apiTypes: Array<'PD' | 'PM' | 'MT'> = ['PD', 'PM', 'MT'];
      const currentId = item.id || String(resolvedId);
      const subId = Number(item.sub_category_id ?? NaN);
      const catId = Number(item.categoryId ?? NaN);

      if (Number.isFinite(subId) && subId > 0) {
        const raw = await showcasesApi
          .listFiltered({ types: apiTypes, sub_category_id: subId, limit: 8, exclude: currentId })
          .catch(() => []);
        return parseGroupedRelatedShowcases(raw, currentId);
      }

      if (Number.isFinite(catId) && catId > 0) {
        const raw = await showcasesApi
          .listFiltered({ types: apiTypes, category_id: catId, limit: 8, exclude: currentId })
          .catch(() => []);
        return parseGroupedRelatedShowcases(raw, currentId);
      }

      const raw = await showcasesApi
        .listFiltered({ types: apiTypes, limit: 8, exclude: currentId })
        .catch(() => []);
      return parseGroupedRelatedShowcases(raw, currentId);
    },
    enabled: shouldFetchRelated && Boolean(resolvedId) && Boolean(item),
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

  const factory: Factory | null =
    embeddedFactory ??
    (item ? (data.factories.find((f) => showcaseIdMatches(f.id, item.factoryId)) ?? null) : null);

  return {
    resolvedId,
    item,
    loading,
    error,
    factory,
    reviews: embeddedReviews,
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
