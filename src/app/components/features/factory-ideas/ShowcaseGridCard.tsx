import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import type { FactoryShowcase } from '@/stores/types';

type ShowcaseGridCardProps = {
  item: FactoryShowcase;
  onClick: () => void;
  isLiked?: boolean;
  onToggleFavorite?: (id: string | number) => void;
};

export function ShowcaseGridCard({
  item,
  onClick,
  isLiked = false,
  onToggleFavorite,
}: ShowcaseGridCardProps) {
  const badgeColor = contentTypeBadge[item.contentType];

  return (
    <article
      className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col'
      onClick={onClick}
    >
      <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
        />
        <span
          className='absolute left-1 top-1 z-[1] rounded-full bg-[var(--factory-idea-badge)] px-1.5 py-0.5 text-[8px] font-bold text-white'
          style={{ '--factory-idea-badge': badgeColor } as React.CSSProperties}
        >
          {contentTypeLabel[item.contentType]}
        </span>
        {onToggleFavorite ? (
          <ShowcaseHeartButton
            showcaseId={item.id}
            isLiked={isLiked}
            onToggle={onToggleFavorite}
            className='absolute top-1 right-1 z-[1]'
          />
        ) : null}
      </div>
      <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
        <div>
          <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
            {item.title}
          </p>
          <div className='flex items-center gap-0.5 mt-0.5'>
            <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
            <span className='text-gray-500 text-[10px] truncate'>
              {(item.location ?? '').trim() || '—'}
            </span>
          </div>
        </div>
        <div className='mt-auto pt-1 border-t border-gray-50'>
          <div className='flex items-center justify-between min-w-0'>
            <div className='flex items-center gap-0.5 min-w-0'>
              <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
              <span className='text-gray-700 text-[10px] font-semibold'>
                {item.factoryRating ?? 0}
              </span>
            </div>
            <span className='text-gray-400 text-[8px] shrink-0'>
              ขั้นต่ำ {item.minOrder} {resolveUnitLabel(item.unitId, item.moqUnit)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
