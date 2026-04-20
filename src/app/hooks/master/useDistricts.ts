import { useQuery } from '@tanstack/react-query';
import { masterApi } from '../../services/api';

type Row = Record<string, unknown>;

export interface DistrictOption {
  id: number;
  name: string;
}

function toOption(r: Row): DistrictOption | null {
  const id = Number(r.district_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(r.district_name ?? r.name_th ?? r.name ?? '').trim();
  if (!name) return null;
  return { id, name };
}

export function useDistricts(provinceId: number | string | null | undefined) {
  const pid = Number(provinceId);
  const enabled = Number.isFinite(pid) && pid > 0;
  return useQuery({
    queryKey: ['master', 'districts', pid] as const,
    enabled,
    queryFn: async () => {
      const raw = await masterApi.districts(pid);
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map(toOption)
        .filter((x): x is DistrictOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
