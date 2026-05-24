import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export interface FactoryTypeOption {
  id: number;
  label: string;
}

export function useFactoryTypes() {
  return useQuery({
    queryKey: masterKeys.factoryTypes() as const,
    queryFn: async () => {
      const raw = await masterApi.factoryTypes();
      const unwrapped = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown>).data
          : [];
      const arr = unwrapped as Row[];
      return arr
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
