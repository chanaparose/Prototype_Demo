import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { mapDistrictOption, type MasterAddressOption } from '@/domain/master/mappers/mapAddressMaster';
import { apiListAsRecords } from '@/lib/apiShape';
import { masterApi } from '@/services/api/masterApi';

export type DistrictOption = MasterAddressOption;

export function useDistricts(provinceId: number | string | null | undefined) {
  const pid = Number(provinceId);
  const enabled = Number.isFinite(pid) && pid > 0;
  return useQuery({
    queryKey: masterKeys.districts(pid),
    enabled,
    queryFn: async () => {
      const raw = await masterApi.districts(pid);
      return apiListAsRecords(raw)
        .map(mapDistrictOption)
        .filter((x): x is DistrictOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
