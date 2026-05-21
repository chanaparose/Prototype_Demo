import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { rfqKeys } from '@/lib/queryKeys';
import { fetchAndMapRfqList, type RfqListResult } from '@/domain/rfq/mappers/mapRfqList';

const EMPTY: RfqListResult = { rfqs: [], orders: [] };

export function useRfqListQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: rfqKeys.list(),
    queryFn: () => fetchAndMapRfqList(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: EMPTY,
  });
}
