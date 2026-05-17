import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export interface ShippingMethodOption {
  id: number;
  label: string;
}

export function useShippingMethods() {
  return useQuery({
    queryKey: masterKeys.shippingMethods() as const,
    queryFn: async () => {
      const raw = await masterApi.getShippingMethods();
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r): ShippingMethodOption | null => {
          const id = Number(r.shipping_method_id ?? r.id);
          const label = String(r.method_name ?? r.name_th ?? r.name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !label) return null;
          return { id, label };
        })
        .filter((x): x is ShippingMethodOption => x != null);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
