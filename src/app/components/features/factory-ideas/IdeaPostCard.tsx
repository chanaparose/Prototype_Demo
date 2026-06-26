import { BadgeCheck, Heart, MapPin, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import type { FactoryShowcase } from '@/stores/types';

type IdeaPostCardProps = {
  item: FactoryShowcase;
  isLiked: boolean;
  onToggleFavorite: (id: string | number) => void;
  onClick: () => void;
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min || 1} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export function IdeaPostCard({ item, isLiked, onToggleFavorite, onClick }: IdeaPostCardProps) {
  const likeCount = item.likes + (isLiked ? 1 : 0);
  const preview = item.excerpt?.trim() || item.content?.trim() || '';

  return (
    <article
      className='overflow-hidden rounded-xl border border-gray-100 bg-white transition-all active:scale-[0.99] hover:border-brand-purple/15'
    >
      {/* Header — factory info */}
      <div className='flex items-center gap-2.5 px-3.5 pt-3.5 pb-2'>
        <div className='h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100'>
          {item.factoryImageUrl ? (
            <ImageWithFallback
              src={item.factoryImageUrl}
              alt={item.factoryName}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-[13px] font-bold text-brand-purple bg-brand-lavender'>
              {(item.factoryName || 'F').slice(0, 1)}
            </div>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1'>
            <span className='truncate text-[12px] font-semibold text-brand-navy-ink'>
              {item.factoryName || 'โรงงาน'}
            </span>
            {item.factoryVerified && (
              <BadgeCheck size={13} className='shrink-0 text-brand-purple' />
            )}
          </div>
          <div className='flex items-center gap-1.5 text-[10px] text-gray-400'>
            {item.location && (
              <>
                <MapPin size={9} />
                <span className='truncate'>{item.location}</span>
                <span>·</span>
              </>
            )}
            <span>{timeAgo(item.postedAt)}</span>
          </div>
        </div>
        <ShowcaseHeartButton
          showcaseId={item.id}
          isLiked={isLiked}
          onToggle={onToggleFavorite}
          className='shrink-0'
        />
      </div>

      {/* Body */}
      <div
        className='cursor-pointer px-3.5 pb-3'
        onClick={onClick}
      >
        <span className='text-[9px] font-bold uppercase tracking-wider text-brand-magenta'>
          ไอเดีย
        </span>
        <h3 className='mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-brand-navy-ink'>
          {item.title}
        </h3>
        {preview ? (
          <p className='mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-gray-500'>
            {preview}
          </p>
        ) : null}
      </div>

      {/* Cover image */}
      {item.image ? (
        <div
          className='cursor-pointer mx-3.5 mb-3 overflow-hidden rounded-lg aspect-[16/9] bg-gray-100'
          onClick={onClick}
        >
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className='h-full w-full object-cover'
          />
        </div>
      ) : null}

      {/* Footer */}
      <div className='flex items-center justify-between border-t border-gray-50 px-3.5 py-2'>
         

        <button
          type='button'
          onClick={onClick}
          className='flex items-center gap-0.5 text-[11px] font-medium text-brand-purple transition-colors hover:text-brand-violet-deep'
        >
          อ่านเพิ่มเติม
          <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}
