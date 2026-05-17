import { useQuery } from '@tanstack/react-query';
import { mapProductionUpdatesBundleFromApi } from '@/domain/production/mappers/mapProductionBundle';
import type { IProductionUpdatesBundle } from '@/domain/production/types/production.model';
import { ordersApi } from '@/services/api/ordersApi';

export function useOrderProductionUpdates(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId, 'production-updates'] as const,
    queryFn: async (): Promise<IProductionUpdatesBundle> => {
      const b = await ordersApi.getProductionUpdatesBundle(orderId!);
      return mapProductionUpdatesBundleFromApi(b);
    },
    enabled: Boolean(orderId),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
