import { useQuery } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

export interface CategoryOption {
  id: number;
  name: string;
  scope?: string;
}

export function useLbiCategoriesByScope(scope: 'PD' | 'MT' | 'ALL') {
  return useQuery({
    queryKey: masterKeys.lbiCategories(scope) as const,
    queryFn: async () => {
      const raw = await masterApi.lbiCategories(scope);
      const obj = raw as Record<string, unknown>;
      const arr = (
        Array.isArray(obj.categories) ? obj.categories : Array.isArray(raw) ? raw : []
      ) as Record<string, unknown>[];
      return arr
        .map((r): CategoryOption | null => {
          const id = Number(r.category_id ?? r.id);
          const name = String(r.name ?? r.category_name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !name) return null;
          const s =
            String(r.scope ?? '')
              .trim()
              .toUpperCase() || undefined;
          return { id, name, scope: s };
        })
        .filter((x): x is CategoryOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
