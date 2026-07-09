import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { IHubResponse } from '@/services/api/types/master.types';
import { Button } from '@/components/ui/button';
import { HubCategoryCard } from '@/components/features/hub/HubCategoryCard';
import {
  hubSectionDividerClass,
  hubSectionShellClass,
} from '@/components/features/hub/hubRowShared';

type HubSectionProps = {
  hub: IHubResponse;
  onNavigate: (path: string) => void;
  className?: string;
};

export function HubSection({ hub, onNavigate, className }: HubSectionProps) {
  const totalFactories = hub.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);

  return (
    <section className={cn(hubSectionShellClass, className)}>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <span className='h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-purple/85 to-brand-purple/35' />
          <div className='min-w-0'>
            <h2 className='truncate text-[14px] font-bold text-[var(--brand-navy)] lg:text-[15px]'>
              {hub.name}
            </h2>
            <p className='mt-0.5 truncate text-[11px] text-gray-500'>
              {hub.categories.length} หมวด
              {totalFactories > 0 ? ` · ${totalFactories} โรงงาน` : ''}
            </p>
          </div>
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => onNavigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          className='group flex shrink-0 items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[12px] font-medium text-brand-purple transition-colors hover:bg-brand-purple/8 active:bg-brand-purple/12'
        >
          ดูทั้งหมด
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple/10 transition-colors group-hover:bg-brand-purple/15'>
            <ChevronRight size={11} strokeWidth={2.5} />
          </span>
        </Button>
      </div>

      <div
        className={cn(
          'flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide lg:gap-2.5',
          hubSectionDividerClass,
        )}
      >
        {hub.categories.map((cat) => (
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
      </div>
    </section>
  );
}
