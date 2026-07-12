import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api/ordersApi';
import { orderKeys, rfqKeys } from '@/lib/queryKeys';
import {
  EMPTY_RFQ_DETAIL,
  fetchAndMapRfqDetail,
  type RfqDetailData,
} from '@/domain/rfq/mappers/mapRfqDetail';

export type { RfqDetailData };

// Category/factory-name lookups come from the API payload now. The data store's
// category/factory lists were always empty at this call site, so empty maps are
// behavior-preserving and let this hook stop subscribing to the whole store.
const EMPTY_MAP = new Map<string, string>();

export function useRfqDetailQuery(rfqId: string | undefined) {
  return useQuery({
    queryKey: rfqKeys.detail(rfqId ?? ''),
    queryFn: () => fetchAndMapRfqDetail(rfqId!, EMPTY_MAP, EMPTY_MAP),
    enabled: Boolean(rfqId),
    placeholderData: (prev) => prev ?? EMPTY_RFQ_DETAIL,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useAcceptRfqOfferMutation(rfqId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const created = await ordersApi.create(Number(quoteId));
      return { orderId: String(created.order_id) };
    },
    onSuccess: async () => {
      if (!rfqId) return;
      await queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      await queryClient.invalidateQueries({ queryKey: rfqKeys.list() });
      await queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });
}
