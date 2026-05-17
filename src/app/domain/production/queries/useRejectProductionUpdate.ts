import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionUpdatesApi } from '@/services/api/ordersApi';

export function useRejectProductionUpdate(orderId: string | undefined) {
  const qc = useQueryClient();
  const key = ['order', orderId, 'production-updates'] as const;

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
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
    retry: 1,
  });
}
