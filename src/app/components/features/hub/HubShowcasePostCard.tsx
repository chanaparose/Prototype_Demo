import { BadgeCheck, Heart, Share2 } from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { getFactoryIdeaDetailPath } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import type { IHubShowcaseItem } from '@/services/api/types/master.types';

function formatSocialCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(value);
}

function resolveShowcaseImage(item: IHubShowcaseItem): string {
  const linked = item.linked_showcases ?? [];
  return linked.find((url) => url.trim()) ?? '';
}

type HubShowcasePostCardProps = {
  item: IHubShowcaseItem;
  isLiked: boolean;
  onToggleFavorite: (id: string | number) => void;
  onClick: () => void;
  className?: string;
};

export function HubShowcasePostCard({
  item,
  isLiked,
  onToggleFavorite,
  onClick,
  className,
}: HubShowcasePostCardProps) {
  const mapped = mapShowcaseFromApi(item as unknown as Record<string, unknown>);
  const imageSrc = resolveShowcaseImage(item) || mapped.image;
  const likes = item.likes_count ?? mapped.likes ?? 0;
  const displayLikes = likes + (isLiked ? 1 : 0);
  const price = item.promo_price ?? item.base_price ?? mapped.promoPrice ?? mapped.basePrice;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${getFactoryIdeaDetailPath(mapped.contentType, mapped.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled or unsupported */
    }
  };

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-all hover:border-brand-purple/15',
        className,
      )}
    >
      <div className='flex items-center gap-2.5 px-3.5 pb-2.5 pt-3.5'>
        <div className='h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-100'>
          {item.factory_image_url ? (
            <ImageWithFallback
              src={item.factory_image_url}
              alt={item.factory_name}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-brand-lavender text-[13px] font-bold text-brand-purple'>
              {(item.factory_name || 'F').slice(0, 1)}
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1'>
            <span className='truncate text-[12px] font-semibold text-[var(--brand-navy)]'>
              {item.factory_name || 'โรงงาน'}
            </span>
            {item.factory_verified ? (
              <BadgeCheck size={13} className='shrink-0 text-brand-purple' />
            ) : null}
          </div>
          <p className='truncate text-[10px] text-gray-400'>
            ถูกใจ {formatSocialCount(displayLikes)}
            {item.factory_rating ? ` · ★ ${item.factory_rating.toFixed(1)}` : ''}
          </p>
        </div>

        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className='shrink-0 rounded-full border border-brand-purple/25 bg-brand-purple/5 px-3 py-1 text-[11px] font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10'
        >
          ดูรายละเอียด
        </button>
      </div>

      {imageSrc ? (
        <button type='button' onClick={onClick} className='block w-full text-left'>
          <div className='relative aspect-square overflow-hidden bg-gray-100'>
            <ImageWithFallback
              src={imageSrc}
              alt={item.title}
              className='h-full w-full object-cover'
            />
          </div>
        </button>
      ) : null}

      <div className='flex items-center gap-3 px-3.5 py-2.5'>
        <ShowcaseHeartButton
          showcaseId={item.showcase_id}
          isLiked={isLiked}
          onToggle={onToggleFavorite}
        />
        <button
          type='button'
          onClick={handleShare}
          className='flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-purple'
          aria-label='แชร์'
        >
          <Share2 size={16} strokeWidth={2} />
        </button>
        <span className='ml-auto flex items-center gap-1 text-[11px] text-gray-400'>
          <Heart size={12} className={isLiked ? 'fill-brand-purple text-brand-purple' : ''} />
          {formatSocialCount(displayLikes)}
        </span>
      </div>

      <button type='button' onClick={onClick} className='w-full px-3.5 pb-3.5 text-left'>
        <p className='line-clamp-2 text-[12px] font-medium leading-snug text-gray-800'>{item.title}</p>
        {price != null && Number(price) > 0 ? (
          <p className='mt-1 text-[15px] font-bold text-[var(--brand-navy)]'>
            {formatCurrencyNoDecimals(Number(price))}
          </p>
        ) : null}
      </button>
    </article>
  );
}
