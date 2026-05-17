import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/services/api/masterApi';

type Row = Record<string, unknown>;

export interface CategoryOption {
  id: number;
  name: string;
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['master', 'product-categories'] as const,
    queryFn: async () => {
      const raw = await masterApi.productCategories();
      const arr = (Array.isArray(raw) ? raw : []) as Row[];
      return arr
        .map((r): CategoryOption | null => {
          const id = Number(r.category_id ?? r.id);
          const name = String(r.name ?? r.category_name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !name) return null;
          return { id, name };
        })
        .filter((x): x is CategoryOption => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
