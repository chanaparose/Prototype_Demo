import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { rfqKeys } from '@/lib/queryKeys';
import { fetchAndMapRfqList } from '@/domain/rfq/mappers/mapRfqList';

export function useRfqListQuery() {
  const { isAuthenticated } = useAuth();
  const dataCtx = useData();

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of dataCtx.categories) m.set(String(c.id), c.name);
    return m;
  }, [dataCtx.categories]);

  const factoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of dataCtx.factories) m.set(String(f.id), f.name);
    return m;
  }, [dataCtx.factories]);

  return useQuery({
    queryKey: rfqKeys.list(),
    queryFn: () => fetchAndMapRfqList(categoryMap, factoryMap),
    enabled: isAuthenticated,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
