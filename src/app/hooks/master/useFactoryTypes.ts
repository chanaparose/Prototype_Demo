import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords } from '@/lib/apiShape';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

export interface FactoryTypeOption {
  id: number;
  label: string;
}

export function useFactoryTypes() {
  return useQuery({
    queryKey: masterKeys.factoryTypes(),
    queryFn: async () => {
      const raw = await masterApi.factoryTypes();
      return apiListAsRecords(raw)
        .map((r): FactoryTypeOption | null => {
          const id = Number(r.factory_type_id ?? r.row_id ?? r.id);
          const label = String(
            r.type_name ?? r.factory_type_name ?? r.name_th ?? r.name ?? '',
          ).trim();
          if (!Number.isFinite(id) || id <= 0 || !label) return null;
          return { id, label };
        })
        .filter((x): x is FactoryTypeOption => x != null);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
