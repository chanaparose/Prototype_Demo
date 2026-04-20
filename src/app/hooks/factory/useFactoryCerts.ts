import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '../../services/api';

type Row = Record<string, unknown>;

export function useFactoryCerts(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: ['factory', String(factoryId), 'certs'] as const,
    enabled,
    queryFn: async () => {
      const raw = await certificatesApi.listByFactory(factoryId as string | number);
      return (Array.isArray(raw) ? raw : []) as Row[];
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
