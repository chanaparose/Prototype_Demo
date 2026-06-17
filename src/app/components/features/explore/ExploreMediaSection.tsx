import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ChevronRight, Play, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { EXPLORE_MEDIA_CONFIG } from '@/components/features/explore/exploreMediaConfig';

type ExploreMediaSectionProps = {
  className?: string;
  variant?: 'mobile' | 'desktop';
};

export function ExploreMediaSection({
  className = '',
  variant = 'mobile',
}: ExploreMediaSectionProps) {
  const navigate = useNavigate();
  const [playerOpen, setPlayerOpen] = useState(false);
  const config = EXPLORE_MEDIA_CONFIG;

  if (!config.enabled) return null;

  const hasVideo = Boolean(config.videoUrl?.trim());
  const isDesktop = variant === 'desktop';

  const openPlayer = () => {
    if (hasVideo) {
      setPlayerOpen(true);
      return;
    }
    navigate('/create-rfq');
  };

  return (
    <>
      <section className={cn('relative', className)}>
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-brand-purple/15 bg-gradient-to-br from-[var(--brand-lavender-chip)] via-white to-[var(--brand-panel-soft)] shadow-sm',
            isDesktop ? 'flex gap-4 p-4' : 'p-3.5',
          )}
        >
          <button
            type='button'
            onClick={openPlayer}
            className={cn(
              'group relative overflow-hidden rounded-xl bg-gray-900/5 shrink-0',
              isDesktop ? 'w-[45%] aspect-video' : 'w-full aspect-video mb-3',
            )}
          >
            <ImageWithFallback
              src={config.thumbnailUrl}
              alt={config.title}
              className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent' />
            <span className='absolute inset-0 flex items-center justify-center'>
              <span className='flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-purple shadow-lg transition-transform group-hover:scale-110'>
                <Play size={20} className='ml-0.5' fill='currentColor' />
              </span>
            </span>
          </button>

          <div className={cn(isDesktop && 'flex flex-1 flex-col justify-center min-w-0')}>
            <h3 className='text-[14px] font-bold text-[var(--brand-navy)] leading-snug'>
              {config.title}
            </h3>
            <p className='mt-1 text-[12px] text-[var(--brand-muted-purple)]'>{config.subtitle}</p>

            {isDesktop ? (
              <ul className='mt-3 space-y-1.5'>
                {config.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className='flex items-start gap-2 text-[12px] text-gray-600 leading-snug'
                  >
                    <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple' />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              variant='unstyled'
              type='button'
              onClick={openPlayer}
              className={cn(
                'inline-flex items-center gap-1 text-[12px] font-semibold text-brand-purple hover:underline',
                isDesktop ? 'mt-4 self-start' : 'mt-2.5',
              )}
            >
              {hasVideo ? 'ดูวิดีโอ' : 'เริ่มส่ง RFQ'}
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </section>

      {playerOpen && hasVideo ? (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
          role='dialog'
          aria-modal
          aria-label={config.title}
        >
          <div className='relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setPlayerOpen(false)}
              className='absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
              aria-label='ปิดวิดีโอ'
            >
              <X size={18} />
            </Button>
            <iframe
              src={config.videoUrl}
              title={config.title}
              className='h-full w-full'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ExploreViewAllHubsButton({
  scope,
  className,
}: {
  scope: 'PD' | 'MT';
  className?: string;
}) {
  const navigate = useNavigate();

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={() => navigate(`/factory-ideas-hub?scope=${scope}`)}
      className={cn(
        'flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-purple/25 bg-white py-2.5 text-[13px] font-semibold text-brand-purple shadow-sm transition-colors hover:border-brand-purple/40 hover:bg-[var(--brand-lavender-chip)]',
        className,
      )}
    >
      ดูหมวดทั้งหมด
      <ArrowRight size={14} />
    </Button>
  );
}
