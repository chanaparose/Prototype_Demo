import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/services/api/httpClient';
import { addressKeys } from '@/lib/queryKeys';

type Row = Record<string, unknown>;

export function useMyAddresses() {
  return useQuery({
    queryKey: addressKeys.me(),
    queryFn: async () => {
      const raw = await httpClient.get<Row[] | { data: Row[] }>('/addresses');
      return (Array.isArray(raw) ? raw : Array.isArray((raw as { data: Row[] }).data) ? (raw as { data: Row[] }).data : []) as Row[];
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
