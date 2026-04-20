import { useQuery } from '@tanstack/react-query';
import { addressesApi } from '../../services/api';

type Row = Record<string, unknown>;

export function useMyAddresses() {
  return useQuery({
    queryKey: ['addresses', 'me'] as const,
    queryFn: async () => {
      const raw = await addressesApi.list();
      return (Array.isArray(raw) ? raw : []) as Row[];
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
