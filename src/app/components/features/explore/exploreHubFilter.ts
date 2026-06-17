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
