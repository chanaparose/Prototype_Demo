import { useEffect, useMemo, useState } from 'react';
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
type ApiType = 'PD' | 'PM' | 'ID';

const ORDER_PRODUCT: Array<ApiType | undefined> = ['PD', 'PM', 'ID', undefined];
const ORDER_PROMO: Array<ApiType | undefined> = ['PM', 'PD', 'ID', undefined];
const ORDER_IDEA: Array<ApiType | undefined> = ['ID', 'PD', 'PM', undefined];

const PAGE_CONFIG: Record<
  'product' | 'promotion' | 'idea',
  { acceptTypes: ShowcaseContentType[]; apiTypeOrder: Array<ApiType | undefined> }
> = {
  product: { acceptTypes: ['product'], apiTypeOrder: ORDER_PRODUCT },
  promotion: { acceptTypes: ['promotion'], apiTypeOrder: ORDER_PROMO },
  idea: { acceptTypes: ['idea'], apiTypeOrder: ORDER_IDEA },
};

async function fetchShowcaseByIdOrdered(
  id: string,
  typeOrder: Array<ApiType | undefined>,
  acceptTypes: ShowcaseContentType[],
): Promise<FactoryShowcase | null> {
  for (const t of typeOrder) {
    const raw = await showcasesApi.list(t).catch(() => []);
    const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
    for (const row of arr) {
      const s = normShowcase(row);
      if (!s.id || !showcaseIdMatches(s.id, id)) continue;
      if (acceptTypes.includes(s.contentType)) return s;
    }
  }
  return null;
}

function useShowcaseDetailPage(kind: 'product' | 'promotion' | 'idea') {
  const { acceptTypes, apiTypeOrder } = PAGE_CONFIG[kind];
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const qId = searchParams.get('showcase_id');
  const resolvedId = (pathId && pathId.trim() !== '' ? pathId : qId)?.trim() ?? '';

  const data = useData();
  const [apiItem, setApiItem] = useState<FactoryShowcase | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const fromContext = useMemo(() => {
    if (!resolvedId) return null;
    return (
      data.factoryShowcases.find(
        (e) => showcaseIdMatches(e.id, resolvedId) && acceptTypes.includes(e.contentType),
      ) ?? null
    );
  }, [data.factoryShowcases, resolvedId, acceptTypes]);

  useEffect(() => {
    if (!resolvedId) {
      setApiItem(null);
      setFetchLoading(false);
      return;
    }
    if (fromContext) {
      setApiItem(null);
      setFetchLoading(false);
      return;
    }

    let cancelled = false;
    setFetchLoading(true);
    setApiItem(null);

    void fetchShowcaseByIdOrdered(resolvedId, apiTypeOrder, acceptTypes).then((found) => {
      if (cancelled) return;
      setApiItem(found);
      setFetchLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedId, fromContext, kind]);

  const item = fromContext ?? apiItem;
  const loading = !!resolvedId && !fromContext && fetchLoading;
  const factory = item ? data.factories.find((f) => showcaseIdMatches(f.id, item.factoryId)) : null;
  const factoryConversation = item
    ? data.conversations.find((c) => showcaseIdMatches(c.factoryId, item.factoryId))
    : null;

  return {
    resolvedId,
    item,
    loading,
    factory,
    factoryConversation,
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
