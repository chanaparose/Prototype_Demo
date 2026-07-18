import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
import { resolvePriceLabel } from '@/components/features/factory-ideas/ShowcaseGridCard';
import { resolveHubIcon } from '@/components/features/hub/HubFilterChips';
import {
  buildFactoryIdeasHubUrl,
  getHubCategoryIds,
  pickRandomHubShowcases,
} from '@/components/features/explore/exploreHubFilter';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import type { IHubResponse } from '@/services/api/types/master.types';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import { ProductCardSkeleton } from '@/components/skeletons/PageSkeletons';
import { cn } from '@lib/utils';

const SHOWCASES_PER_HUB = 10;

type HubShowcaseRow = {
  hub: IHubResponse;
  items: IExploreShowcase[];
};

type ExploreHubShowcaseSectionsProps = {
  activeScope: HubScope;
  hubs: IHubResponse[];
  showcases: IExploreShowcase[];
  isLoading?: boolean;
  hubsLoading?: boolean;
  isLiked: (id: string | number) => boolean;
  onToggleFavorite: (id: string | number) => void;
  className?: string;
  /** Slightly larger title on desktop */
  variant?: 'mobile' | 'desktop';
};

export function ExploreHubShowcaseSections({
  activeScope,
  hubs,
  showcases,
  isLoading = false,
  hubsLoading = false,
  isLiked,
  onToggleFavorite,
  className,
  variant = 'mobile',
}: ExploreHubShowcaseSectionsProps) {
  const navigate = useNavigate();
  const isMaterial = activeScope === 'MT';
  const badgeLabel = isMaterial ? 'วัตถุดิบ' : 'สินค้า';
  const badgeColor = isMaterial ? 'var(--status-success)' : 'var(--brand-orange)';
  const accentClass = isMaterial ? 'text-status-success' : 'text-brand-orange';
  const prefix = isMaterial ? 'วัตถุดิบแนะนำ' : 'สินค้าแนะนำ';

  const rows = useMemo<HubShowcaseRow[]>(() => {
    return hubs
      .map((hub) => ({
        hub,
        items: pickRandomHubShowcases(
          showcases,
          getHubCategoryIds(hub),
          hub.hub_id,
          SHOWCASES_PER_HUB,
        ),
      }))
      .filter((row) => row.items.length > 0);
  }, [hubs, showcases]);

  const titleClass =
    variant === 'desktop'
      ? 'text-[15px] font-bold text-brand-navy-ink'
      : 'text-[14px] font-bold text-brand-navy-ink';

  if (isLoading || hubsLoading) {
    return (
      <div className={cn('space-y-6', className)} data-tour='products'>
        {[0, 1, 2].map((section) => (
          <div key={section}>
            <div className='mb-2.5 flex items-center justify-between px-4 md:px-0'>
              <div className='h-4 w-44 animate-pulse rounded bg-gray-200' />
              <div className='h-3 w-16 animate-pulse rounded bg-gray-100' />
            </div>
            <div
              className='flex gap-2 overflow-x-auto pb-2 pl-3 md:pl-0'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
              <div className='w-3 shrink-0' aria-hidden />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn('px-4 md:px-0', className)} data-tour='products'>
        <div className='rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-4 py-6 text-center'>
          <p className='text-sm font-medium text-gray-600'>
            {isMaterial ? 'ยังไม่มีวัตถุดิบแนะนำในขณะนี้' : 'ยังไม่มีสินค้าแนะนำในขณะนี้'}
          </p>
          <p className='mt-1 text-xs text-gray-400'>ดูหมวดทั้งหมดเพื่อเริ่มค้นหาโรงงานที่ใช่</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={() =>
              navigate(buildFactoryIdeasHubUrl(isMaterial ? 'material' : 'product', null))
            }
            className='mt-3 rounded-full border border-brand-magenta/40 bg-white px-4 py-2 text-sm font-medium text-brand-magenta hover:bg-brand-panel-hover transition-colors'
          >
            {isMaterial ? 'ดูวัตถุดิบแนะนำ' : 'ดูสินค้าแนะนำ'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)} data-tour='products'>
      {rows.map(({ hub, items }) => {
        const Icon = resolveHubIcon(hub.name);
        const seeMoreHref = buildFactoryIdeasHubUrl(isMaterial ? 'material' : 'product', hub);

        return (
          <section key={hub.hub_id}>
            <div className='mb-2.5 flex items-center justify-between gap-3 px-4 md:px-0'>
              <h3 className={cn(titleClass, 'flex min-w-0 items-center gap-1.5')}>
                <Icon size={15} className={cn('shrink-0', accentClass)} strokeWidth={2.25} />
                <span className='truncate'>
                  {prefix}
                  <span className='text-slate-300'> · </span>
                  {hub.name}
                </span>
              </h3>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(seeMoreHref)}
                className={cn(
                  'flex shrink-0 items-center gap-0.5 text-[12px] font-medium',
                  accentClass,
                )}
              >
                ดูเพิ่มเติม <ChevronRight size={13} />
              </Button>
            </div>

            <div
              className='flex gap-2 overflow-x-auto pb-2 pl-3 md:gap-3 md:pl-0'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((item) => (
                <ShowcaseCard
                  key={item.id}
                  image={item.image}
                  title={item.title}
                  priceLabel={resolvePriceLabel(item)}
                  location={item.location ?? ''}
                  moqLabel={`ขั้นต่ำ ${item.minOrder ?? 0} ${resolveUnitLabel(item.unitId, item.moqUnit)}`}
                  badge={{ label: badgeLabel, color: badgeColor }}
                  heart={{
                    showcaseId: item.id,
                    isLiked: isLiked(item.id),
                    onToggle: onToggleFavorite,
                  }}
                  onClick={() =>
                    navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`)
                  }
                  className={cn(
                    'w-[155px] shrink-0',
                    variant === 'desktop' && 'w-[170px]',
                  )}
                />
              ))}
              <div className='w-3 shrink-0' aria-hidden />
            </div>
          </section>
        );
      })}
    </div>
  );
}
