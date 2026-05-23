import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import {
  mapSubDistrictOption,
  type MasterSubDistrictOption,
} from '@/domain/master/mappers/mapAddressMaster';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export type SubDistrictOption = MasterSubDistrictOption;

export function useSubDistricts(districtId: number | string | null | undefined) {
  const did = Number(districtId);
  const enabled = Number.isFinite(did) && did > 0;
  return useQuery({
    queryKey: masterKeys.subDistricts(did),
    enabled,
    queryFn: async () => {
      const raw = await masterApi.subDistricts(did);
      const unwrapped = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown>).data
          : [];
      const arr = unwrapped as Row[];
      return arr
        .map(mapSubDistrictOption)
        .filter((x): x is SubDistrictOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
