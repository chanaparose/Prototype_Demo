import { useMemo } from 'react';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import {
  buildFactoryIdeasHubUrl,
  filterShowcasesByHub,
  mapFactoryApiRowToExploreFactory,
  sortHubFactoriesByExploreOrder,
} from '@/components/features/explore/exploreHubFilter';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { useFactoryIdeasFactoryListQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import type { IHubResponse } from '@/services/api/types/master.types';

type UseExploreHubFilteredContentArgs = {
  activeScope: HubScope;
  exploreProducts: IExploreShowcase[];
  exploreMatrials?: IExploreShowcase[];
  factories: FactoryItem[];
  selectedHub: IHubResponse | null;
  categoryIds: Set<number>;
  showcaseLimit?: number;
  factoryLimit?: number;
};

export function useExploreHubFilteredContent({
  activeScope,
  exploreProducts,
  exploreMatrials,
  factories,
  selectedHub,
  categoryIds,
  showcaseLimit = 8,
  factoryLimit = 8,
}: UseExploreHubFilteredContentArgs) {
  const sourceShowcases = activeScope === 'PD' ? exploreProducts : (exploreMatrials ?? []);
  const isHubScoped = Boolean(selectedHub);
  const hubName = selectedHub?.name ?? '';

  const hubShowcases = useMemo(
    () => filterShowcasesByHub(sourceShowcases, categoryIds),
    [categoryIds, sourceShowcases],
  );

  const showcases = useMemo(() => hubShowcases.slice(0, showcaseLimit), [hubShowcases, showcaseLimit]);

  const hubId = selectedHub?.hub_id;
  const scopedFactoriesQ = useFactoryIdeasFactoryListQuery(isHubScoped, undefined, hubId);

  const hubFactories = useMemo(() => {
    if (!isHubScoped) return factories;

    const scopedFactories = (scopedFactoriesQ.data ?? []).map((factory) =>
      mapFactoryApiRowToExploreFactory(factory as unknown as Record<string, unknown>),
    );
    return sortHubFactoriesByExploreOrder(scopedFactories, factories);
  }, [factories, isHubScoped, scopedFactoriesQ.data]);

  const filteredFactories = useMemo(
    () => hubFactories.slice(0, factoryLimit),
    [factoryLimit, hubFactories],
  );

  const showcaseTitle =
    activeScope === 'PD'
      ? isHubScoped
        ? `สินค้าแนะนำ · ${hubName}`
        : 'สินค้าแนะนำ'
      : isHubScoped
        ? `วัตถุดิบแนะนำ · ${hubName}`
        : 'วัตถุดิบแนะนำ';

  const factoryTitle = isHubScoped ? `โรงงานแนะนำ · ${hubName}` : 'โรงงานแนะนำ';
  const factorySubtitle = isHubScoped
    ? `โรงงานที่รับงานในหมวด ${hubName}`
    : 'โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าคุณภาพสูง';

  const seeMoreShowcaseHref = buildFactoryIdeasHubUrl(
    activeScope === 'PD' ? 'product' : 'material',
    selectedHub,
  );
  const seeMoreFactoryHref = buildFactoryIdeasHubUrl('factory', selectedHub);

  return {
    showcases,
    factories: filteredFactories,
    isHubScoped,
    hasHubShowcases: showcases.length > 0,
    hasHubFactories: filteredFactories.length > 0,
    factoriesLoading: isHubScoped && scopedFactoriesQ.isLoading,
    showcaseTitle,
    factoryTitle,
    factorySubtitle,
    seeMoreShowcaseHref,
    seeMoreFactoryHref,
  };
}
