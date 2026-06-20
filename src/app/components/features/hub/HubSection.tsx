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
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <span className='h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-purple/85 to-brand-purple/35' />
          <div className='min-w-0'>
            <h2 className='truncate text-base font-bold text-[var(--brand-navy)]'>{hub.name}</h2>
            {totalFactories > 0 ? (
              <p className='mt-0.5 text-xs font-medium text-slate-500'>
                {totalFactories} โรงงาน
              </p>
            ) : null}
          </div>
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => onNavigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          className='flex shrink-0 items-center gap-0.5 rounded-lg border border-brand-purple/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:border-brand-purple/30 hover:bg-brand-lavender-muted/30'
        >
          ดูครบ
          <ChevronRight size={12} strokeWidth={2.25} />
        </Button>
      </div>

      <div
        className={cn(
          'flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide lg:gap-2.5 lg:overflow-hidden',
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
