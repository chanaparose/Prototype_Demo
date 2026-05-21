import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { orderKeys } from '@/lib/queryKeys';
import { fetchAndMapOrderList } from '@/domain/order/mappers/mapOrderList';
import { useRfqListQuery } from '@/domain/rfq/queries/useRfqListQuery';

export function useOrderListQuery() {
  const { isAuthenticated } = useAuth();
  const dataCtx = useData();
  const rfqListQuery = useRfqListQuery();
  const rfqs = rfqListQuery.data?.rfqs ?? [];

  const factoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of dataCtx.factories) m.set(String(f.id), f.name);
    return m;
  }, [dataCtx.factories]);

  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: () => fetchAndMapOrderList(factoryMap, rfqs),
    enabled: isAuthenticated && !rfqListQuery.isLoading,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
