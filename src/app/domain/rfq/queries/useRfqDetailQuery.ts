import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useData } from '@/stores/useDataStore';
import { ordersApi } from '@/services/api/ordersApi';
import { orderKeys, rfqKeys } from '@/lib/queryKeys';
import {
  EMPTY_RFQ_DETAIL,
  fetchAndMapRfqDetail,
  type RfqDetailData,
} from '@/domain/rfq/mappers/mapRfqDetail';

export type { RfqDetailData };

export function useRfqDetailQuery(rfqId: string | undefined) {
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
    queryKey: rfqKeys.detail(rfqId ?? ''),
    queryFn: () => fetchAndMapRfqDetail(rfqId!, categoryMap, factoryMap),
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
