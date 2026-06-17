import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import type { IHubResponse } from '@/services/api/types/master.types';

export function getHubCategoryIds(hub: IHubResponse | null): Set<number> {
  if (!hub) return new Set();
  return new Set(hub.categories.map((cat) => cat.category_id));
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

export function filterFactoriesByHubShowcases(
  factories: FactoryItem[],
  hubShowcases: IExploreShowcase[],
  categoryIds: Set<number>,
): FactoryItem[] {
  if (categoryIds.size === 0) return factories;
  const factoryIds = new Set(
    hubShowcases.map((item) => item.factoryId).filter((id) => id !== ''),
  );
  if (factoryIds.size === 0) return factories;
  const filtered = factories.filter((factory) => factoryIds.has(factory.id));
  return filtered.length > 0 ? filtered : factories;
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
