import { useQuery } from '@tanstack/react-query';
import { quotationApi } from '@/services/api/rfqApi';
import type { IQuotationBreakdown, IQuotationCreateRequest } from '@/services/api/types/rfq.types';
import { getErrorMessage } from '@/lib/apiError';

export function usePreviewBreakdown(state: Partial<IQuotationCreateRequest>) {
  const stateKey = JSON.stringify(state);
  const query = useQuery({
    queryKey: ['quotation', 'preview', stateKey],
    queryFn: () => quotationApi.preview(state),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    loading: query.isFetching,
    error: query.error ? getErrorMessage(query.error, 'preview failed') : '',
    breakdown: (query.data ?? null) as IQuotationBreakdown | null,
  };
}
