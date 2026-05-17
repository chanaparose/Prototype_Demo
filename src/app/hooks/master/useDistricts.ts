import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { mapDistrictOption, type MasterAddressOption } from '@/domain/master/mappers/mapAddressMaster';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export type DistrictOption = MasterAddressOption;

export function useDistricts(provinceId: number | string | null | undefined) {
  const pid = Number(provinceId);
  const enabled = Number.isFinite(pid) && pid > 0;
  return useQuery({
    queryKey: masterKeys.districts(pid) as const,
    enabled,
    queryFn: async () => {
      const raw = await masterApi.districts(pid);
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map(mapDistrictOption)
        .filter((x): x is DistrictOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
