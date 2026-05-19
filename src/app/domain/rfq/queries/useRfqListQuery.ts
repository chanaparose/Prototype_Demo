import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { rfqKeys } from '@/lib/queryKeys';
import { fetchAndMapRfqList } from '@/domain/rfq/mappers/mapRfqList';

export function useRfqListQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: rfqKeys.list(),
    queryFn: () => fetchAndMapRfqList(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
