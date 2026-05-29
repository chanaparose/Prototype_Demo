import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useData } from '@/stores/useDataStore';
import { type Factory, type FactoryShowcase } from '@/stores/types';
import { useQuery } from '@tanstack/react-query';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { showcaseKeys } from '@/lib/queryKeys';
import { showcasesApi } from '@/services/api/factoryApi';
import { pickScalarString } from '@/utils/pickScalarString';

// ─── Embedded types returned by GET /showcases/:id ───────────────────────────

export type ReviewItem = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
  imageUrls?: string[];
};

export type ReviewsData = {
  summary: {
    average: number;
    total: number;
    breakdown: Record<string, number>;
  };
  items: ReviewItem[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showcaseIdMatches(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') return na === nb;
  return false;
}

function mapEmbeddedFactory(fRaw: Record<string, unknown>): Factory {
  return {
    id: pickScalarString(fRaw.factory_id),
    name: pickScalarString(fRaw.factory_name),
    location: pickScalarString(fRaw.province),
    provinceName: pickScalarString(fRaw.province),
    rating: Number(fRaw.rating ?? 0),
    reviews: Number(fRaw.review_count ?? 0),
    specialization: pickScalarString(fRaw.factory_type),
    tags: [],
    minOrder: Number(fRaw.min_order ?? 0),
    leadTime: pickScalarString(fRaw.lead_time_desc),
    image: pickScalarString(fRaw.image_url),
    verified: Boolean(fRaw.verified),
    completedOrders: Number(fRaw.completed_orders ?? 0),
    priceRange: '',
    factoryTypeName: pickScalarString(fRaw.factory_type),
  };
}

function mapEmbeddedReviews(rRaw: Record<string, unknown>): ReviewsData {
  const s = (rRaw.summary ?? {}) as Record<string, unknown>;
  const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const b = (s.breakdown ?? s.rating_breakdown) as Record<string, unknown> | undefined;
  if (b && typeof b === 'object') {
    for (const k of ['5', '4', '3', '2', '1']) {
      const n = Number(b[k] ?? 0);
      if (Number.isFinite(n)) breakdown[k] = n;
    }
  }
  const rawItems = (Array.isArray(rRaw.items) ? rRaw.items : []) as Record<string, unknown>[];
  return {
    summary: {
      average: Number(s.average ?? 0),
      total: Number(s.total ?? 0),
      breakdown,
    },
    items: rawItems
      .map((row) => {
        const imgUrls = Array.isArray(row.image_urls)
          ? (row.image_urls as string[]).filter((u) => typeof u === 'string' && u.trim() !== '')
          : [];
        return {
          id: String(row.review_id ?? row.id ?? ''),
          reviewer: String(row.reviewer_name ?? row.reviewer ?? 'ลูกค้า'),
          rating: Number(row.rating ?? 0),
          comment: String(row.comment ?? ''),
          createdAt: String(row.created_at ?? ''),
          ...(imgUrls.length > 0 ? { imageUrls: imgUrls } : {}),
        };
      })
      .filter((r) => r.id),
  };
}

function parseGroupedRelated(raw: unknown, excludeId: string): FactoryShowcase[] {
  const buckets: FactoryShowcase[] = [];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const rows of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(rows)) {
        buckets.push(...(rows as Record<string, unknown>[]).map(mapShowcaseFromApi));
      }
    }
  } else if (Array.isArray(raw)) {
    buckets.push(...(raw as Record<string, unknown>[]).map(mapShowcaseFromApi));
  }
  const uniq = new Map<string, FactoryShowcase>();
  for (const row of buckets) {
    if (!row.id || row.id === excludeId) continue;
    if (!['product', 'promotion', 'material'].includes(row.contentType)) continue;
    if (!uniq.has(row.id)) uniq.set(row.id, row);
  }
  return [...uniq.values()].slice(0, 8);
}

// ─── Page config ─────────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

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

  // [1] GET /api/v1/showcases/:id — showcase + factory + reviews in one call
  const detailQ = useQuery({
    queryKey: showcaseKeys.detail(resolvedId),
    queryFn: async () => {
      const raw = (await showcasesApi.get(resolvedId)) as Record<string, unknown>;
      const row = unwrapShowcaseDetailPayload(raw);
      const s = mapShowcaseFromApi(row);
      if (!s.id || !acceptTypes.includes(s.contentType)) {
        throw new Error('ไม่พบข้อมูลโชว์เคส');
      }
      const fRaw = (row.factory ?? raw.factory) as Record<string, unknown> | undefined;
      const rRaw = (row.reviews ?? raw.reviews) as Record<string, unknown> | undefined;
      // Fallback: construct factory from flat showcase fields when no nested object
      const embeddedFactory = fRaw
        ? mapEmbeddedFactory(fRaw)
        : raw.factory_name
          ? mapEmbeddedFactory({
              factory_id: raw.factory_id,
              factory_name: raw.factory_name,
              province: raw.province_name,
              rating: raw.factory_rating,
              review_count: raw.factory_review_count,
              factory_type: raw.factory_specialization,
              image_url: raw.factory_image_url,
              verified: raw.factory_verified,
              completed_orders: raw.completed_orders,
              min_order: raw.moq,
              lead_time_desc: raw.lead_time_days != null ? `${raw.lead_time_days} วัน` : undefined,
            })
          : null;
      return {
        showcase: s,
        factory: embeddedFactory,
        reviews: rRaw ? mapEmbeddedReviews(rRaw) : null,
      };
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
    detailQ.error instanceof Error ? detailQ.error.message : detailQ.error ? 'โหลดไม่สำเร็จ' : null;

  useEffect(() => {
    viewedIdRef.current = '';
  }, [resolvedId]);

  const item = apiItem ?? fromContext;

  const shouldFetchRelated = kind !== 'idea' && Boolean(resolvedId);

  // [3] GET /api/v1/showcases?types=PD,PM,MT&sub_category_id=X&limit=8
  // รอให้ item พร้อมก่อน → ใช้ sub_category_id/category_id โดยตรง ไม่ต้อง fetch ซ้ำ
  const relatedQ = useQuery({
    queryKey: [...showcaseKeys.detail(resolvedId), 'related', kind],
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
        return parseGroupedRelated(raw, currentId);
      }

      if (Number.isFinite(catId) && catId > 0) {
        const raw = await showcasesApi
          .listFiltered({ types: apiTypes, category_id: catId, limit: 8, exclude: currentId })
          .catch(() => []);
        return parseGroupedRelated(raw, currentId);
      }

      const raw = await showcasesApi
        .listFiltered({ types: apiTypes, limit: 8, exclude: currentId })
        .catch(() => []);
      return parseGroupedRelated(raw, currentId);
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

  // [2] POST /api/v1/showcases/:id/view — fire & forget
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

  // factory: embedded จาก API response → fallback to store
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
