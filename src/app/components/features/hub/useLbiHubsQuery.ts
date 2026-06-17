import { useQuery } from '@tanstack/react-query';
import { getLbiHubs } from '@/services/api/masterApi';
import type { IHubResponse } from '@/services/api/types/master.types';

export function useLbiHubsQuery() {
  return useQuery({
    queryKey: ['lbi-hubs', 'all'],
    queryFn: async () => {
      const res = await getLbiHubs();
      const raw = res as unknown as { hubs?: IHubResponse[] };
      return raw.hubs ?? [];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
