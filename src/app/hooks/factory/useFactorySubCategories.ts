import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../services/api';

type Row = Record<string, unknown>;

export function useFactorySubCategories(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: ['factory', String(factoryId), 'sub-categories'] as const,
    enabled,
    queryFn: async () => {
      const raw = await factoriesApi.getSubCategories(factoryId as string | number);
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r) => Number(r.sub_category_id ?? r.id))
        .filter((n) => Number.isFinite(n) && n > 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
