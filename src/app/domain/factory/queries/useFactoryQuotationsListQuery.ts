import { useQuery } from '@tanstack/react-query';
import { quotationsApi } from '@/services/api/rfqApi';
import { quotationKeys } from '@/lib/queryKeys';

export function useFactoryQuotationsListQuery() {
  return useQuery({
    queryKey: quotationKeys.listMine(),
    queryFn: async () => {
      const raw = await quotationsApi.listMine();
      return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
