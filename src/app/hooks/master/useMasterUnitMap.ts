import { useQuery } from '@tanstack/react-query';
import { buildMasterUnitMap } from '@/domain/master/mappers/mapMasterUnits';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

export function useMasterUnitMap() {
  return useQuery({
    queryKey: masterKeys.units(),
    queryFn: async () => {
      const raw = await masterApi.getUnits();
      const arr = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? []);
      return buildMasterUnitMap(arr);
    },
    staleTime: 5 * 60_000,
  });
}
