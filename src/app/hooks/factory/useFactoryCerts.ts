import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords } from '@/lib/apiShape';
import { certificatesApi } from '@/services/api/userApi';
import { factoryKeys } from '@/lib/queryKeys';

export function useFactoryCerts(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: factoryKeys.certificates(factoryId),
    enabled,
    queryFn: async () => {
      const raw = await certificatesApi.list(factoryId as string | number);
      return apiListAsRecords(raw);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
