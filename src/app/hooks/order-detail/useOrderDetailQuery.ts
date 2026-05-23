import { useQuery } from '@tanstack/react-query';
import { unwrapOrderFromApi } from '@/domain/order/mappers/unwrapOrderFromApi';
import { ordersApi } from '@/services/api/ordersApi';
import { orderKeys } from '@/lib/queryKeys';

export function useOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn: async () => unwrapOrderFromApi(await ordersApi.get(orderId!)),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
