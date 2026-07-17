import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { IHubResponse } from '@/services/api/types/master.types';
import {
  HUB_CARD_IMG_CLASS,
  HUB_CARD_IMG_FRAME_CLASS,
  getPalette,
} from '@/components/features/hub/HubCategoryCard';

export function resolveHubImg(hub: Pick<IHubResponse, 'img' | 'image_url' | 'image'>): string {
  return String(hub.img || hub.image_url || hub.image || '').trim();
}

export function HubCard({
  hub,
  onClick,
  className,
}: {
  hub: IHubResponse;
  onClick: () => void;
  className?: string;
}) {
  const palette = getPalette(hub.hub_id);
  const imgSrc = resolveHubImg(hub);
  const totalFactories = hub.categories.reduce((sum, cat) => sum + (cat.factory_count ?? 0), 0);
  const categoryCount = hub.categories.length;

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group flex w-[140px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] active:scale-[0.97] lg:w-[160px]',
        className,
      )}
    >
      <div className={HUB_CARD_IMG_FRAME_CLASS} style={{ aspectRatio: '1 / 1' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={hub.name}
            className={HUB_CARD_IMG_CLASS}
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

      <div className='flex flex-1 items-center gap-1 px-2 py-1'>
        <div className='min-w-0 flex-1'>
          <span className='line-clamp-2 text-[11px] font-bold leading-tight text-gray-800 group-hover:text-brand-purple lg:text-[12px]'>
            {hub.name}
          </span>
          <span className='mt-1 block text-[10px] font-medium leading-none text-gray-400 lg:text-[11px]'>
            {totalFactories > 0
              ? `${totalFactories.toLocaleString('th-TH')} โรงงาน`
              : categoryCount > 0
                ? `${categoryCount} หมวด`
                : 'เร็วๆ นี้'}
          </span>
        </div>
        <span
          className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 transition-colors group-hover:bg-brand-purple/15'
          aria-hidden
        >
          <ChevronRight size={12} strokeWidth={2.5} className='text-brand-purple' />
        </span>
      </div>
    </button>
  );
}
