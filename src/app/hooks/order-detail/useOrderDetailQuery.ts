import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../services/api';

export function useOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId] as const,
    queryFn: async () => ordersApi.get(orderId!),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
