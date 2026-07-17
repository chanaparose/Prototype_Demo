import type { CSSProperties } from 'react';
import { MapPin, Star } from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import {
  factoryIdeasContentTypeBadge,
  factoryIdeasContentTypeLabel,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import type { IHubShowcaseItem } from '@/services/api/types/master.types';

function resolveShowcaseImage(item: IHubShowcaseItem): string {
  return (item.linked_showcases ?? []).find((url) => url.trim()) ?? '';
}

function resolvePrice(item: IHubShowcaseItem): number | null {
  const promo = item.promo_price;
  const base = item.base_price;
  if (promo != null && Number.isFinite(Number(promo)) && Number(promo) > 0) return Number(promo);
  if (base != null && Number.isFinite(Number(base)) && Number(base) > 0) return Number(base);
  return null;
}

type ShowcaseContentType = Exclude<FactoryIdeasContentType, 'all'>;

function resolveContentType(raw: string): ShowcaseContentType {
  const key = raw.trim().toUpperCase();
  if (key === 'PD' || key === 'PR' || key === 'PRODUCT') return 'product';
  if (key === 'PM' || key === 'PROMOTION') return 'promotion';
  if (key === 'MT' || key === 'MATERIAL') return 'material';
  if (key === 'ID' || key === 'IDEA') return 'idea';
  if (key === 'FACTORY') return 'factory';
  const lower = raw.trim().toLowerCase();
  if (lower in factoryIdeasContentTypeLabel) return lower as ShowcaseContentType;
  return 'product';
}

type HubHighlightGridCardProps = {
  item: IHubShowcaseItem;
  /** Rank badge 1–10 only; omit / null to hide. */
  rank?: number | null;
  isLiked: boolean;
  onToggleFavorite: (id: string | number) => void;
  onClick: () => void;
  className?: string;
};

export function HubHighlightGridCard({
  item,
  rank,
  isLiked,
  onToggleFavorite,
  onClick,
  className,
}: HubHighlightGridCardProps) {
  const imageSrc = resolveShowcaseImage(item);
  const contentType = resolveContentType(item.content_type ?? '');
  const badgeColor = factoryIdeasContentTypeBadge[contentType];
  const showRank = rank != null && rank >= 1 && rank <= 10;
  const location = (item.factory_name ?? '').trim() || '—';
  const rating = item.factory_rating ?? 0;
  const moq = item.moq != null && item.moq > 0 ? item.moq : null;
  const unit = (item.unit_name_th ?? '').trim();

  return (
    <article
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all active:scale-[0.98] hover:border-brand-purple/20',
        className,
      )}
      onClick={onClick}
    >
      <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            alt={item.title}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-2xl font-bold text-brand-purple/30'>
            {(item.factory_name || 'T').slice(0, 1)}
          </div>
        )}

        {showRank ? (
          <span className='pointer-events-none absolute bottom-0.5 left-1.5 z-[2] text-[22px] font-black italic leading-none tracking-tight text-brand-purple lg:text-[24px]'>
            {rank}
          </span>
        ) : null}

        <span
          className='absolute left-1 top-1 z-[1] rounded-full bg-[var(--factory-idea-badge)] px-1.5 py-0.5 text-[8px] font-bold text-white'
          style={{ '--factory-idea-badge': badgeColor } as CSSProperties}
        >
          {factoryIdeasContentTypeLabel[contentType]}
        </span>

        <ShowcaseHeartButton
          showcaseId={item.showcase_id}
          isLiked={isLiked}
          onToggle={onToggleFavorite}
          className='absolute right-1 top-1 z-[1]'
        />
      </div>

      <div className='flex flex-1 flex-col justify-between gap-0.5 p-2'>
        <h3 className='mb-0.5 truncate text-xs font-medium leading-tight text-gray-700 transition-colors group-hover:text-brand-purple'>
          {item.title}
        </h3>

        <div className='mt-0.5 flex items-center gap-0.5'>
          <MapPin className='h-2.5 w-2.5 shrink-0 text-gray-400' />
          <span className='truncate text-[10px] text-gray-500'>{location}</span>
        </div>

        <div className='mt-auto border-t border-gray-50 pt-1'>
          <div className='flex min-w-0 items-center justify-between'>
            <div className='flex min-w-0 items-center gap-0.5'>
              <Star className='h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400' />
              <span className='text-[10px] font-semibold text-gray-700'>{rating}</span>
            </div>
            <span className='shrink-0 text-[8px] text-gray-400'>
              {moq != null
                ? `ขั้นต่ำ ${moq.toLocaleString('th-TH')}${unit ? ` ${unit}` : ''}`
                : 'สอบถามขั้นต่ำ'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export { resolvePrice };
