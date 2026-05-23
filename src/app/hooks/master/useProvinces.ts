import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { mapProvinceOption, type MasterAddressOption } from '@/domain/master/mappers/mapAddressMaster';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export type ProvinceOption = MasterAddressOption;

export function useProvinces() {
  return useQuery({
    queryKey: masterKeys.provinces(),
    queryFn: async () => {
      const raw = await masterApi.provinces();
      const unwrapped = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown>).data
          : [];
      const arr = unwrapped as Row[];
      return arr
        .map(mapProvinceOption)
        .filter((x): x is ProvinceOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
