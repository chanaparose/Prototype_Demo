import {
  useAcceptRfqOfferMutation,
  useRfqDetailQuery,
  type RfqDetailData,
} from '@/domain/rfq/queries/useRfqDetailQuery';
import { EMPTY_RFQ_DETAIL } from '@/domain/rfq/mappers/mapRfqDetail';

export type { RfqDetailData };

export function useRfqDetail(rfqId: string | undefined) {
  const query = useRfqDetailQuery(rfqId);
  const acceptMutation = useAcceptRfqOfferMutation(rfqId);
  const detail = query.data ?? EMPTY_RFQ_DETAIL;

  const error =
    query.error instanceof Error ? query.error.message : query.error ? 'โหลดข้อมูลไม่สำเร็จ' : null;

  return {
    rfq: detail.rfq,
    relatedOrder: detail.relatedOrder,
    quoteOrderMap: detail.quoteOrderMap,
    quoteHistories: detail.quoteHistories,
    loading: query.isLoading,
    error,
    refetch: query.refetch,
    acceptOffer: async (quoteId: string) => acceptMutation.mutateAsync(quoteId),
    shippingMethodId: detail.shippingMethodId,
    addressSummary: detail.addressSummary,
    targetDays: detail.targetDays,
  };
}
