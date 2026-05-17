import type React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared';

type ShowcaseHeroGalleryProps = {
  gallery: string[];
  fallbackImage: string;
  title: string;
  activeImage: number;
  onActiveImageChange: (next: number | ((prev: number) => number)) => void;
  accentColor: string;
  borderColor: string;
  className?: string;
  thumbnailCount?: number;
  badge?: React.ReactNode;
};

export function ShowcaseHeroGallery({
  gallery,
  fallbackImage,
  title,
  activeImage,
  onActiveImageChange,
  accentColor,
  borderColor,
  className = 'w-[450px] shrink-0',
  thumbnailCount = 5,
  badge,
}: ShowcaseHeroGalleryProps) {
  const hasMultipleImages = gallery.length > 1;

  return (
    <div className={className}>
      <div
        className='relative aspect-[4/3] rounded-xl overflow-hidden border'
        style={{ borderColor, background: 'var(--neutral-warm-surface)' }}
      >
        <ImageWithFallback
          src={gallery[activeImage] ?? fallbackImage}
          alt={title}
          className='w-full h-full object-cover'
        />
        {badge}
        {hasMultipleImages ? (
          <>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => onActiveImageChange((p) => (p - 1 + gallery.length) % gallery.length)}
              className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors'
              aria-label='รูปก่อนหน้า'
            >
              <ChevronLeft className='w-5 h-5' />
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => onActiveImageChange((p) => (p + 1) % gallery.length)}
              className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors'
              aria-label='รูปถัดไป'
            >
              <ChevronRight className='w-5 h-5' />
            </Button>
            <span className='absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums'>
              {activeImage + 1} / {gallery.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className='grid grid-cols-5 gap-2 mt-3'>
          {gallery.slice(0, thumbnailCount).map((url, idx) => {
            const active = idx === activeImage;
            return (
              <Button
                variant='unstyled'
                key={`${url}-${idx}`}
                type='button'
                onMouseEnter={() => onActiveImageChange(idx)}
                onClick={() => onActiveImageChange(idx)}
                className='aspect-square rounded-lg overflow-hidden border-2 transition-colors'
                style={{ borderColor: active ? accentColor : borderColor }}
              >
                <img src={url} alt='' className='w-full h-full object-cover' />
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
