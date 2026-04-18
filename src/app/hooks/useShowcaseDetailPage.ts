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
