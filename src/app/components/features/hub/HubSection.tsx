import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { IHubResponse } from '@/services/api/types/master.types';
import { Button } from '@/components/ui/button';
import { HubCategoryCard, HubSeeAllCard } from '@/components/features/hub/HubCategoryCard';
import {
  getHubRowVisibleCount,
  hubSectionDividerClass,
  hubSectionShellClass,
} from '@/components/features/hub/hubRowShared';
import { useIsLgUp } from '@/components/features/hub/useIsLgUp';

type HubSectionProps = {
  hub: IHubResponse;
  onNavigate: (path: string) => void;
  className?: string;
};

export function HubSection({ hub, onNavigate, className }: HubSectionProps) {
  const totalFactories = hub.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);
  const isLgUp = useIsLgUp();
  const visibleCount = getHubRowVisibleCount(hub.categories.length, isLgUp);
  const visible = hub.categories.slice(0, visibleCount);
  const hidden = hub.categories.slice(visibleCount);
  const hiddenCount = hidden.length;

  return (
    <section className={cn(hubSectionShellClass, className)}>
      <div className='flex items-center justify-between gap-3 px-3.5 pb-2.5 pt-3.5'>
        <div className='min-w-0'>
          <h2 className='truncate text-[13px] font-bold text-[var(--brand-navy)]'>{hub.name}</h2>
          {totalFactories > 0 ? (
            <p className='mt-0.5 text-[10px] text-gray-400'>{totalFactories} โรงงาน</p>
          ) : null}
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => onNavigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          className='flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-brand-purple/30 hover:text-brand-purple'
        >
          ดูทั้งหมด
          <ChevronRight size={12} strokeWidth={2.25} />
        </Button>
      </div>

      <div
        className={cn(
          'flex flex-nowrap items-stretch gap-2.5 overflow-x-auto px-3.5 py-3.5 scrollbar-hide lg:gap-3 lg:overflow-hidden',
          hubSectionDividerClass,
        )}
      >
        {visible.map((cat) => (
          <HubCategoryCard
            key={cat.category_id}
            cat={cat}
            onClick={() =>
              onNavigate(
                `/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}&category_id=${cat.category_id}`,
              )
            }
          />
        ))}
        {hiddenCount > 0 ? (
          <HubSeeAllCard
            count={hiddenCount}
            hiddenNames={hidden.map((c) => c.name)}
            onClick={() => onNavigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          />
        ) : null}
      </div>
    </section>
  );
}
