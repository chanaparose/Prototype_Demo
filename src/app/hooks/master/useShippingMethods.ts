import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';
import { mapShippingMethodsList } from '@/domain/master/mappers/mapShippingMethod';

export type ShippingMethodOption = {
  id: number;
  label: string;
};

export function useShippingMethods() {
  return useQuery({
    queryKey: masterKeys.shippingMethods() as const,
    queryFn: async () => {
      const raw = await masterApi.getShippingMethods();
      return mapShippingMethodsList(raw).map((row) => ({
        id: row.id,
        label: row.name,
      }));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
