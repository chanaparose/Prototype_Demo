import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export interface SubDistrictOption {
  id: number;
  name: string;
  zipCode?: string;
}

function toOption(r: Row): SubDistrictOption | null {
  const id = Number(r.sub_district_id ?? r.row_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(r.sub_district_name ?? r.name_th ?? r.name ?? r.name_en ?? '').trim();
  if (!name) return null;
  const zipCodeRaw = String(r.zip_code ?? r.postcode ?? '').trim();
  return {
    id,
    name,
    ...(zipCodeRaw ? { zipCode: zipCodeRaw } : {}),
  };
}

export function useSubDistricts(districtId: number | string | null | undefined) {
  const did = Number(districtId);
  const enabled = Number.isFinite(did) && did > 0;
  return useQuery({
    queryKey: ['master', 'sub-districts', did] as const,
    enabled,
    queryFn: async () => {
      const raw = await masterApi.subDistricts(did);
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map(toOption)
        .filter((x): x is SubDistrictOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
