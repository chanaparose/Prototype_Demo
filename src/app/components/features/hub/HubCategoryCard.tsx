import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { ICategoryForHubResponse } from '@/services/api/types/master.types';

const PASTEL_PALETTES = [
  { bg: 'bg-[#FFF3E8]', text: 'text-[#B85C00]' },
  { bg: 'bg-[#EEF3FF]', text: 'text-[#3D5FBF]' },
  { bg: 'bg-[#F0FBF4]', text: 'text-[#1A7A45]' },
  { bg: 'bg-[#FFF0F9]', text: 'text-[#A0267A]' },
  { bg: 'bg-[#F5F0FF]', text: 'text-[#6D28D9]' },
  { bg: 'bg-[#FFFBEB]', text: 'text-[#92601A]' },
  { bg: 'bg-[#F0FFFE]', text: 'text-[#107272]' },
];

function getPalette(categoryId: number) {
  return PASTEL_PALETTES[categoryId % PASTEL_PALETTES.length];
}

export function HubCategoryCard({
  cat,
  onClick,
}: {
  cat: ICategoryForHubResponse;
  onClick: () => void;
}) {
  const palette = getPalette(cat.category_id);
  const imgSrc = cat.img || cat.image_url || cat.image || '';

  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex w-[120px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] active:scale-[0.97] lg:w-[140px]'
    >
      {/* 1:1 image area */}
      <div
        className={cn('relative flex w-full items-center justify-center p-[3%]', palette.bg)}
        style={{ aspectRatio: '1 / 1' }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={cat.name}
            className='h-full w-full rounded-[10px] object-contain'
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <span className={cn('text-3xl opacity-30', palette.text)}>□</span>
          </div>
        )}
      </div>

      {/* text area */}
      <div className='flex flex-1 flex-col px-2.5 py-2'>
        <span className='line-clamp-2 text-[11px] font-bold leading-tight text-gray-800 group-hover:text-brand-purple lg:text-[12px]'>
          {cat.name}
        </span>
        <span
          className={cn(
            'mt-1 text-[10px] font-medium leading-none lg:text-[11px]',
            cat.factory_count > 0 ? 'text-brand-purple' : 'text-gray-400',
          )}
        >
          {cat.factory_count > 0 ? `${cat.factory_count} โรงงาน` : 'เร็วๆ นี้'}
        </span>
      </div>
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
  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex w-[120px] shrink-0 flex-col overflow-hidden rounded-xl border border-dashed border-brand-purple/30 bg-brand-violet-soft/60 text-left shadow-none transition-all hover:border-brand-purple/50 hover:bg-brand-violet-soft active:scale-[0.97] lg:w-[140px]'
    >
      <div className='relative w-full bg-brand-lavender-chip/50' style={{ aspectRatio: '1 / 1' }}>
        <div className='flex h-full w-full items-center justify-center'>
          <ArrowRight size={24} strokeWidth={2} className='text-brand-purple/50 group-hover:text-brand-purple' />
        </div>
      </div>
      <div className='flex flex-1 flex-col px-2.5 py-2'>
        <span className='line-clamp-2 text-[11px] font-bold leading-tight text-brand-purple lg:text-[12px]'>
          +{count} หมวด
        </span>
        {hiddenNames.length > 0 ? (
          <span className='mt-0.5 line-clamp-1 text-[10px] text-brand-purple/60'>
            {hiddenNames[0]}
          </span>
        ) : null}
        {totalFactories > 0 ? (
          <span className='mt-1 text-[10px] font-medium leading-none text-brand-purple lg:text-[11px]'>
            {totalFactories} โรงงาน
          </span>
        ) : null}
      </div>
    </button>
  );
}
