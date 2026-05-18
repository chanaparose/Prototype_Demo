import { useQuery } from '@tanstack/react-query';
import { addressesApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export function useMyAddresses() {
  return useQuery({
    queryKey: ['addresses', 'me'] as const,
    queryFn: async () => {
      const raw = await addressesApi.list();
      const unwrapped = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>).data)
          ? (raw as Record<string, unknown>).data
          : [];
      return unwrapped as Row[];
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
