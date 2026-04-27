import { useEffect, useMemo, useState } from 'react';
import { showcasesApi } from '../services/api';
import { normShowcase } from './useShowcases';
import type { FactoryShowcase } from '../contexts/DataContext';

export function useRelatedShowcases(ids: number[]) {
  const [items, setItems] = useState<FactoryShowcase[]>([]);
  const [loading, setLoading] = useState(false);

  const stableIds = useMemo(
    () =>
      [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))].sort(
        (a, b) => a - b,
      ),
    [ids],
  );

  useEffect(() => {
    if (!stableIds.length) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(stableIds.map((id) => showcasesApi.get(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const valid = results
          .filter((r): r is Record<string, unknown> => r != null)
          .map((r) => normShowcase((r.showcase && typeof r.showcase === 'object'
            ? (r.showcase as Record<string, unknown>)
            : r)))
          .filter((s) => s.id && (s.contentType === 'product' || s.contentType === 'promotion'));
        setItems(valid);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stableIds.join(',')]);

  return { items, loading };
}
