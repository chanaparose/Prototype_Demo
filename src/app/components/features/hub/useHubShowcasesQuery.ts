import { useQuery } from '@tanstack/react-query';
import { getHubShowcases } from '@/services/api/masterApi';
import type { IHubWithShowcases } from '@/services/api/types/master.types';

export function useHubShowcasesQuery(limit = 4) {
  return useQuery({
    queryKey: ['hub-showcases', limit],
    queryFn: async () => {
      const res = await getHubShowcases(limit);
      return (res.hubs ?? []).filter((h) => h.showcases.length > 0) as IHubWithShowcases[];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
