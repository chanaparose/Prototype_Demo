import { useMemo } from 'react';
import { showcasesApi } from '@/services/api/factoryApi';
import { normShowcase } from '@/hooks/useShowcases';
import { type FactoryShowcase } from '@/stores/types';
import { useApiCall } from '@/hooks/data/useApiCall';

export function useRelatedShowcases(ids: number[]) {
  const stableIds = useMemo(
    () =>
      [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))].sort(
        (a, b) => a - b,
      ),
    [ids],
  );

  const stableKey = stableIds.join(',');
  const { data: items = [], loading } = useApiCall(
    async () => {
      const results = await Promise.all(
        stableIds.map((id) => showcasesApi.get(id).catch(() => null)),
      );
      return results
        .filter((r): r is Record<string, unknown> => r != null)
        .map((r) =>
          normShowcase(
            r.showcase && typeof r.showcase === 'object'
              ? (r.showcase as Record<string, unknown>)
              : r,
          ),
        )
        .filter((s) => s.id && (s.contentType === 'product' || s.contentType === 'promotion'));
    },
    [stableKey],
    { enabled: stableIds.length > 0, initialData: [] as FactoryShowcase[] },
  );

  return { items, loading };
}
