import { useMemo } from 'react';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import {
  buildFactoryIdeasHubUrl,
  filterFactoriesByHubShowcases,
  filterShowcasesByHub,
} from '@/components/features/explore/exploreHubFilter';
import type { HubScope } from '@/components/features/hub/hubRowShared';
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

  const hubShowcases = useMemo(
    () => filterShowcasesByHub(sourceShowcases, categoryIds),
    [categoryIds, sourceShowcases],
  );

  const showcases = useMemo(() => hubShowcases.slice(0, showcaseLimit), [hubShowcases, showcaseLimit]);

  const hubFactories = useMemo(
    () => filterFactoriesByHubShowcases(factories, hubShowcases, categoryIds),
    [categoryIds, factories, hubShowcases],
  );

  const filteredFactories = useMemo(
    () => hubFactories.slice(0, factoryLimit),
    [factoryLimit, hubFactories],
  );

  const isHubScoped = Boolean(selectedHub && categoryIds.size > 0);
  const hubName = selectedHub?.name ?? '';

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
    showcaseTitle,
    factoryTitle,
    factorySubtitle,
    seeMoreShowcaseHref,
    seeMoreFactoryHref,
  };
}
