import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/services/api/httpClient';

type Row = Record<string, unknown>;

export function useMyAddresses() {
  return useQuery({
    queryKey: ['addresses', 'me'] as const,
    queryFn: async () => {
      const raw = await httpClient.get<Row[] | { data: Row[] }>('/addresses');
      return (Array.isArray(raw) ? raw : Array.isArray((raw as { data: Row[] }).data) ? (raw as { data: Row[] }).data : []) as Row[];
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
