import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { orderKeys } from '@/lib/queryKeys';
import { fetchAndMapOrderList } from '@/domain/order/mappers/mapOrderList';
import { useRfqListQuery } from '@/domain/rfq/queries/useRfqListQuery';

// Factory-name lookups come from the API payload now. The data store's factory
// list was always empty at this call site, so an empty map is behavior-
// preserving and lets this hook stop subscribing to the whole store.
const EMPTY_FACTORY_MAP = new Map<string, string>();

export function useOrderListQuery() {
  const { isAuthenticated } = useAuth();
  const rfqListQuery = useRfqListQuery();
  const rfqs = rfqListQuery.data?.rfqs ?? [];

  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: () => fetchAndMapOrderList(EMPTY_FACTORY_MAP, rfqs),
    enabled: isAuthenticated && !rfqListQuery.isLoading,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
