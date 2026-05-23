import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '@/services/api/userApi';
import { factoryKeys } from '@/lib/queryKeys';

type Row = Record<string, unknown>;

export function useFactoryCerts(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: factoryKeys.certificates(factoryId),
    enabled,
    queryFn: async () => {
      const raw = await certificatesApi.list(factoryId as string | number);
      return (Array.isArray(raw) ? raw : []) as Row[];
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
