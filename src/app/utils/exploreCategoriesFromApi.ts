import { categoriesApi, masterApi } from '@/services/api/masterApi';
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
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  for (const key of ['data', 'items', 'results', 'categories']) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }
  return [];
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

export function parseCategoriesResponse(raw: unknown): IExploreCategory[] {
  const rows = extractCategoriesArray(raw);
  const parsed: IExploreCategory[] = [];
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const mapped = mapExploreCategoryFromApi(item as IExploreCategoryResponse);
    if (mapped) parsed.push(mapped);
  }

  const dedupe = new Map<string, IExploreCategory>();
  for (const c of parsed) {
    dedupe.set(String(c.id), c);
  }
  return [...dedupe.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export function mergeCategoryLists(
  primary: IExploreCategory[],
  secondary: IExploreCategory[],
): IExploreCategory[] {
  const map = new Map<string, IExploreCategory>();
  for (const c of secondary) map.set(String(c.id), c);
  for (const c of primary) map.set(String(c.id), c);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
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

export type FetchExploreCategoriesResult = {
  merged: IExploreCategory[];
  bothFailed: boolean;
  catRejected: boolean;
  masterRejected: boolean;
  firstError: Error | null;
};

export async function fetchExploreCategoriesListOnly(): Promise<FetchExploreCategoriesResult> {
  const res: PromiseSettledResult<unknown> = await categoriesApi
    .list(6)
    .then((value) => ({ status: 'fulfilled' as const, value }))
    .catch((reason) => ({ status: 'rejected' as const, reason }));
  const fromCat = res.status === 'fulfilled' ? parseCategoriesResponse(res.value) : [];
  const merged = fromCat;

  const bothFailed = res.status === 'rejected';
  const firstError =
    res.status === 'rejected'
      ? res.reason instanceof Error
        ? res.reason
        : new Error(String(res.reason))
      : null;

  return {
    merged,
    bothFailed,
    catRejected: res.status === 'rejected',
    masterRejected: false,
    firstError,
  };
}

export async function fetchExploreCategoriesMerged(): Promise<FetchExploreCategoriesResult> {
  const [catRes, masterRes] = await Promise.allSettled([
    categoriesApi.list(),
    masterApi.getProductCategories(),
  ]);

  const fromCat = catRes.status === 'fulfilled' ? parseCategoriesResponse(catRes.value) : [];
  const fromMaster =
    masterRes.status === 'fulfilled' ? parseCategoriesResponse(masterRes.value) : [];
  const merged = mergeCategoryLists(fromCat, fromMaster);

  const bothFailed = catRes.status === 'rejected' && masterRes.status === 'rejected';
  const firstError =
    catRes.status === 'rejected'
      ? catRes.reason instanceof Error
        ? catRes.reason
        : new Error(String(catRes.reason))
      : masterRes.status === 'rejected'
        ? masterRes.reason instanceof Error
          ? masterRes.reason
          : new Error(String(masterRes.reason))
        : null;

  return {
    merged,
    bothFailed,
    catRejected: catRes.status === 'rejected',
    masterRejected: masterRes.status === 'rejected',
    firstError,
  };
}
