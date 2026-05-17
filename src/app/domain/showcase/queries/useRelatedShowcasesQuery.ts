import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { showcasesApi } from '@/services/api/factoryApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { type FactoryShowcase } from '@/stores/types';
import { showcaseKeys } from '@/lib/queryKeys';

export function useRelatedShowcasesQuery(ids: number[]) {
  const stableIds = useMemo(
    () =>
      [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))].sort(
        (a, b) => a - b,
      ),
    [ids],
  );

  const stableKey = stableIds.join(',');

  return useQuery({
    queryKey: showcaseKeys.related(stableKey),
    queryFn: async () => {
      const results = await Promise.all(
        stableIds.map((id) => showcasesApi.get(id).catch(() => null)),
      );
      return results
        .filter((r): r is Record<string, unknown> => r != null)
        .map((r) =>
          mapShowcaseFromApi(
            r.showcase && typeof r.showcase === 'object'
              ? (r.showcase as Record<string, unknown>)
              : r,
          ),
        )
        .filter(
          (s): s is FactoryShowcase =>
            Boolean(s.id) && (s.contentType === 'product' || s.contentType === 'promotion'),
        );
    },
    enabled: stableIds.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
