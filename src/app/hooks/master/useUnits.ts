import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export interface UnitOption {
  id: number;
  label: string;
}

export function useUnits() {
  return useQuery({
    queryKey: ['master', 'units'] as const,
    queryFn: async () => {
      const raw = await masterApi.units();
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r): UnitOption | null => {
          const id = Number(r.unit_id ?? r.id);
          const label = String(r.name_th ?? r.name ?? r.unit_name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !label) return null;
          return { id, label };
        })
        .filter((x): x is UnitOption => x != null);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
