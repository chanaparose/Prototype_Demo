import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { ICategoryForHubResponse } from '@/services/api/types/master.types';
import { hubRowCardClass } from '@/components/features/hub/hubRowShared';

export function HubCategoryCard({
  cat,
  onClick,
}: {
  cat: ICategoryForHubResponse;
  onClick: () => void;
}) {
  const subText = (cat.sub_preview ?? []).slice(0, 2).join(' · ');
  const factoryLabel = cat.factory_count > 0 ? `${cat.factory_count} โรงงาน` : 'ดูรายการในหมวดนี้';

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        hubRowCardClass,
        'group border border-brand-purple/10 bg-white transition-all hover:border-brand-purple/20 hover:bg-brand-lavender-muted/25 active:scale-[0.98]',
      )}
    >
      <span className='line-clamp-2 text-sm font-bold leading-snug text-[var(--brand-navy)] group-hover:text-brand-purple'>
        {cat.name}
      </span>
      {subText ? (
        <span className='mt-1 line-clamp-2 text-xs leading-tight text-slate-500'>{subText}</span>
      ) : null}
      <span
        className={cn(
          'mt-auto pt-2 text-xs font-semibold leading-none',
          cat.factory_count > 0 ? 'text-brand-purple' : 'text-gray-400',
        )}
      >
        {factoryLabel}
      </span>
    </button>
  );
}

export function HubSeeAllCard({
  count,
  hiddenNames,
  onClick,
}: {
  count: number;
  hiddenNames: string[];
  onClick: () => void;
}) {
  const subText = hiddenNames.slice(0, 2).join(' · ');

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        hubRowCardClass,
        'border border-dashed border-brand-purple/15 bg-white transition-all hover:border-brand-purple/30 hover:bg-brand-lavender-muted/25 active:scale-[0.98]',
      )}
    >
      <span className='mb-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple/12 text-brand-purple'>
        <ArrowRight size={14} strokeWidth={2.5} />
      </span>
      <span className='text-sm font-bold leading-snug text-brand-purple'>+{count} หมวด</span>
      <span className='mt-0.5 text-xs font-medium text-brand-purple/75'>ดูครบทุกหมวด</span>
      {subText ? (
        <span className='mt-auto line-clamp-2 pt-2 text-xs leading-tight text-[var(--brand-muted-purple)]'>
          {subText}
        </span>
      ) : null}
    </button>
  );
}
