import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { normalizeFactoryIdeaFactory } from '@/components/features/factory-ideas/factoryIdeasTheme';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import type { IHubResponse } from '@/services/api/types/master.types';

export type ExploreFactoryWithCategories = FactoryItem & {
  categoryIds: number[];
};

export function getHubCategoryIds(hub: IHubResponse | null): Set<number> {
  if (!hub) return new Set();
  return new Set(hub.categories.map((cat) => cat.category_id));
}

export function mapFactoryApiRowToExploreFactory(
  row: Record<string, unknown>,
): ExploreFactoryWithCategories {
  const factory = normalizeFactoryIdeaFactory(row);
  return {
    id: factory.id,
    name: factory.name,
    image: factory.image,
    location: factory.location,
    rating: factory.rating,
    reviews: factory.reviews,
    minOrder: factory.minOrder,
    verified: factory.verified,
    categoryIds: factory.categoryIds ?? [],
  };
}

export function filterShowcasesByHub(
  showcases: IExploreShowcase[],
  categoryIds: Set<number>,
): IExploreShowcase[] {
  if (categoryIds.size === 0) return showcases;
  return showcases.filter((item) => {
    if (!item.categoryId) return false;
    return categoryIds.has(Number(item.categoryId));
  });
}

/** Deterministic shuffle so hub rows stay stable across re-renders of the same data. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = seed >>> 0 || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/** Pick up to `limit` showcases for a hub, randomly ordered (stable per hub_id + data). */
export function pickRandomHubShowcases(
  showcases: IExploreShowcase[],
  categoryIds: Set<number>,
  hubId: number,
  limit = 10,
): IExploreShowcase[] {
  if (categoryIds.size === 0) return [];
  const filtered = filterShowcasesByHub(showcases, categoryIds);
  if (filtered.length <= limit) {
    return seededShuffle(filtered, hubId * 31 + filtered.length);
  }
  return seededShuffle(filtered, hubId * 31 + filtered.length).slice(0, limit);
}

export function filterFactoriesByHubCategoryIds(
  factories: ExploreFactoryWithCategories[],
  categoryIds: Set<number>,
): FactoryItem[] {
  if (categoryIds.size === 0) return factories;
  return factories.filter((factory) =>
    factory.categoryIds.some((categoryId) => categoryIds.has(categoryId)),
  );
}

export function sortHubFactoriesByExploreOrder(
  factories: FactoryItem[],
  exploreOrder: FactoryItem[],
): FactoryItem[] {
  const order = new Map(exploreOrder.map((factory, index) => [factory.id, index]));
  return [...factories].sort((a, b) => {
    const aRank = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bRank = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviews - a.reviews;
  });
}

export function buildFactoryIdeasHubUrl(
  type: 'product' | 'material' | 'factory',
  hub: IHubResponse | null,
): string {
  const params = new URLSearchParams({ type });
  if (hub) {
    params.set('hub_id', String(hub.hub_id));
    params.set('hub_scope', hub.scope);
  }
  return `/factory-ideas?${params.toString()}`;
}

export function buildFactoryIdeasHubPageUrl(scope: HubScope): string {
  return `/factory-ideas-hub?scope=${scope}`;
}
