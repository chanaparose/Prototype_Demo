import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionUpdatesApi } from '@/services/api/ordersApi';
import { orderKeys } from '@/lib/queryKeys';

export function useRejectProductionUpdate(orderId: string | undefined) {
  const qc = useQueryClient();
  const key = orderKeys.productionUpdates(orderId);

  return useMutation({
    mutationFn: async ({
      updateId,
      rejected_reason,
    }: {
      updateId: number | string;
      rejected_reason: string;
    }) => productionUpdatesApi.reject(updateId, { rejected_reason }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: orderKeys.detail(String(orderId ?? '')) });
    },
    retry: 1,
  });
}
