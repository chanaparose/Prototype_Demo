import { useQuery } from '@tanstack/react-query';
import { masterApi } from '../../services/api';

type Row = Record<string, unknown>;

export interface ProvinceOption {
  id: number;
  name: string;
}

function toOption(r: Row): ProvinceOption | null {
  const id = Number(r.province_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(r.province_name ?? r.name_th ?? r.name ?? '').trim();
  if (!name) return null;
  return { id, name };
}

export function useProvinces() {
  return useQuery({
    queryKey: ['master', 'provinces'] as const,
    queryFn: async () => {
      const raw = await masterApi.provinces();
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map(toOption)
        .filter((x): x is ProvinceOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
