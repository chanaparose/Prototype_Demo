import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords } from '@/lib/apiShape';
import { httpClient } from '@/services/api/httpClient';
import { addressKeys } from '@/lib/queryKeys';

export function useMyAddresses() {
  return useQuery({
    queryKey: addressKeys.me(),
    queryFn: async () => {
      const raw = await httpClient.get<unknown>('/addresses');
      return apiListAsRecords(raw);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
