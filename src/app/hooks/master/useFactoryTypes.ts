import { useQuery } from '@tanstack/react-query';
import { masterApi } from '../../services/api';

type Row = Record<string, unknown>;

export interface FactoryTypeOption {
  id: number;
  label: string;
}

export function useFactoryTypes() {
  return useQuery({
    queryKey: ['master', 'factory-types'] as const,
    queryFn: async () => {
      const raw = await masterApi.factoryTypes();
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r): FactoryTypeOption | null => {
          const id = Number(r.factory_type_id ?? r.id);
          const label = String(r.name ?? r.name_th ?? r.factory_type_name ?? '').trim();
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
