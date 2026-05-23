import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api/factoryApi';
import { factoryKeys } from '@/lib/queryKeys';

type Row = Record<string, unknown>;

export function useFactoryCategories(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: factoryKeys.categories(factoryId),
    enabled,
    queryFn: async () => {
      const raw = await factoriesApi.getCategories(factoryId as string | number);
      const rawObj = raw as Record<string, unknown>;
      const arr = (Array.isArray(rawObj?.data) ? rawObj.data : Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r) => Number(r.category_id ?? r.row_id ?? r.id))
        .filter((n) => Number.isFinite(n) && n > 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
