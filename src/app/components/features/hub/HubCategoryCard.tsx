import { ArrowRight, PackageSearch } from 'lucide-react';
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

  return (
    <button type='button' onClick={onClick} className={hubRowCardClass}>
      <div className='mb-1 flex items-center gap-1 lg:mb-1.5 lg:gap-1.5'>
        <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-purple/10 text-brand-purple lg:h-6 lg:w-6 lg:rounded-lg'>
          <PackageSearch size={12} strokeWidth={2.25} className='lg:hidden' />
          <PackageSearch size={14} strokeWidth={2.25} className='hidden lg:block' />
        </span>
        <span className='line-clamp-1 text-xs font-medium leading-tight text-gray-700 group-hover:text-brand-purple lg:text-sm lg:text-[var(--brand-navy)]'>
          {cat.name}
        </span>
      </div>
      {subText ? (
        <span className='line-clamp-2 text-[10px] leading-tight text-[var(--brand-muted-purple)] lg:text-xs'>
          {subText}
        </span>
      ) : (
        <span className='text-[10px] text-gray-400 lg:text-xs'>ดูรายการในหมวดนี้</span>
      )}
      <span
        className={cn(
          'mt-auto text-[9px] font-semibold leading-none lg:text-xs lg:font-bold',
          cat.factory_count > 0 ? 'text-brand-purple' : 'text-gray-400',
        )}
      >
        {cat.factory_count > 0 ? `${cat.factory_count} โรงงาน` : 'ดูหมวดนี้'}
      </span>
    </button>
  );
}

export function HubSeeAllCard({
  count,
  hiddenNames,
  totalFactories,
  onClick,
}: {
  count: number;
  hiddenNames: string[];
  totalFactories: number;
  onClick: () => void;
}) {
  const subText = hiddenNames.slice(0, 2).join(' · ');

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(hubRowCardClass, 'border-dashed hover:border-brand-purple/40')}
    >
      <div className='mb-1 flex items-center gap-1 lg:mb-1.5 lg:gap-1.5'>
        <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-purple/10 text-brand-purple lg:h-6 lg:w-6 lg:rounded-lg'>
          <ArrowRight size={12} strokeWidth={2.25} className='lg:hidden' />
          <ArrowRight size={14} strokeWidth={2.25} className='hidden lg:block' />
        </span>
        <span className='line-clamp-1 text-xs font-medium leading-tight text-brand-purple lg:text-sm'>
          +{count} หมวด
        </span>
      </div>
      {subText ? (
        <span className='line-clamp-2 text-[10px] leading-tight text-[var(--brand-muted-purple)] lg:text-xs'>
          {subText}
        </span>
      ) : (
        <span className='text-[10px] text-gray-400 lg:text-xs'>ดูครบทุกหมวด</span>
      )}
      {totalFactories > 0 ? (
        <span className='mt-auto text-[9px] font-semibold leading-none text-brand-purple lg:text-xs lg:font-bold'>
          {totalFactories} โรงงานในกลุ่มนี้
        </span>
      ) : null}
    </button>
  );
}
