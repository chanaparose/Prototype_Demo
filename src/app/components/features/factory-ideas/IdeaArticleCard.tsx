import { BadgeCheck, ChevronRight, FileText } from 'lucide-react';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';

type IdeaArticleCardProps = {
  id: string;
  title: string;
  excerpt?: string;
  factoryName?: string;
  factoryVerified?: boolean;
  isLiked: boolean;
  onToggleFavorite: (id: string | number) => void;
  onClick: () => void;
  className?: string;
};

export function IdeaArticleCard({
  id,
  title,
  excerpt,
  factoryName,
  factoryVerified,
  isLiked,
  onToggleFavorite,
  onClick,
  className = '',
}: IdeaArticleCardProps) {
  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white py-2.5 pl-3 pr-9 transition-all active:scale-[0.99] hover:border-brand-purple/20 md:py-3 md:pl-3.5 md:pr-10 ${className}`}
    >
      <div className='flex gap-2.5 md:gap-3'>
        <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-page)] text-brand-magenta ring-1 ring-brand-purple/10 md:h-10 md:w-10'>
          <FileText size={16} strokeWidth={2} aria-hidden />
        </div>

        <div className='min-w-0 flex-1'>
          <span className='text-[9px] font-semibold uppercase tracking-wider text-brand-magenta'>
            บทความ
          </span>
          <h3 className='mt-0.5 line-clamp-2 text-[12px] font-bold leading-snug text-brand-navy-ink transition-colors group-hover:text-brand-magenta md:text-[13px]'>
            {title}
          </h3>
          {excerpt?.trim() ? (
            <p className='mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500'>{excerpt}</p>
          ) : null}
          <div className='mt-1.5 flex min-w-0 items-center justify-between gap-2'>
            <span className='inline-flex min-w-0 items-center gap-0.5 text-[10px] text-gray-400'>
              <span className='truncate'>{factoryName || 'โรงงาน'}</span>
              {factoryVerified ? (
                <BadgeCheck className='h-3 w-3 shrink-0 text-brand-mauve' aria-hidden />
              ) : null}
            </span>
            <span className='inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-brand-purple/70 transition-colors group-hover:text-brand-purple'>
              อ่าน
              <ChevronRight size={11} className='transition-transform group-hover:translate-x-0.5' />
            </span>
          </div>
        </div>
      </div>

      <ShowcaseHeartButton
        showcaseId={id}
        isLiked={isLiked}
        onToggle={onToggleFavorite}
        className='absolute top-2 right-2 z-[1]'
      />
    </article>
  );
}
