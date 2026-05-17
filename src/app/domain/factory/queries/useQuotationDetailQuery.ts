import { useQuery } from '@tanstack/react-query';
import { quotationsApi } from '@/services/api/rfqApi';
import { quotationKeys } from '@/lib/queryKeys';

export function useQuotationDetailQuery(quotationId: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(quotationId ?? ''),
    queryFn: () => quotationsApi.get(quotationId!),
    enabled: Boolean(quotationId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useQuotationHistoryQuery(quotationId: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.history(quotationId ?? ''),
    queryFn: () => quotationsApi.history(quotationId!),
    enabled: Boolean(quotationId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
