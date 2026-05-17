import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api';

export function useMyFactory() {
  return useQuery({
    queryKey: ['factory', 'me'] as const,
    queryFn: () => factoriesApi.getMe(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
