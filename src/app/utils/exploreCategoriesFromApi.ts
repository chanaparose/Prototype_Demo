import { unwrapApiList } from '@/lib/apiShape';
import { mapExploreCategoryFromApi } from '@/domain/explore/mappers/mapExploreCategory';
import type { IExploreCategory } from '@/domain/explore/types/explore.model';
import type { IExploreCategoryResponse } from '@/services/api/types/explore.types';

export const TILE_DB_ID_TO_CONTEXT_ID: Record<string, string> = {
  '1': 'pet_food',
  '2': 'supplements',
  '3': 'pet_toys',
  '4': 'pet_clothes',
  '6': 'other',
};

function extractCategoriesArray(raw: unknown): unknown[] {
  return unwrapApiList(raw, ['categories']);
}

export function categoryIdsMatch(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') return na === nb;
  return false;
}

export function exploreDisplayNameForTile(
  categoryId: string,
  fallbackName: string,
  fromApi: IExploreCategory[],
  fromProp?: IExploreCategory[],
): string {
  const matchApi = fromApi.find((c) => categoryIdsMatch(c.id, categoryId));
  if (matchApi?.name) return matchApi.name;
  const matchPropDirect = fromProp?.find((c) => categoryIdsMatch(c.id, categoryId));
  if (matchPropDirect?.name) return matchPropDirect.name;
  const contextId = TILE_DB_ID_TO_CONTEXT_ID[categoryId];
  if (contextId) {
    const matchPropSlug = fromProp?.find((c) => c.id === contextId);
    if (matchPropSlug?.name) return matchPropSlug.name;
  }
  return fallbackName;
}
