import { useQuery } from '@tanstack/react-query';
import { quotationsApi } from '@/services/api/rfqApi';
import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import { quotationKeys } from '@/lib/queryKeys';

export function useFactoryQuotationsListQuery() {
  return useQuery({
    queryKey: quotationKeys.listMine(),
    queryFn: async (): Promise<IQuotationResponse[]> => {
      const raw = await quotationsApi.listMine();
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
