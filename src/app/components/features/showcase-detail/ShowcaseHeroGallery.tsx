import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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
  badge?: ReactNode;
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
  const [api, setApi] = useState<CarouselApi>();
  const images = gallery.length ? gallery : [fallbackImage];

  useEffect(() => {
    if (!api) return;
    api.scrollTo(activeImage);
  }, [activeImage, api]);

  useEffect(() => {
    if (!api) return;
    const syncActiveImage = (nextApi: CarouselApi) => {
      if (!nextApi) return;
      onActiveImageChange(nextApi.selectedScrollSnap());
    };
    api.on('select', syncActiveImage);
    return () => {
      api.off('select', syncActiveImage);
    };
  }, [api, onActiveImageChange]);

  return (
    <div className={className}>
      <div
        className='relative aspect-[4/3] rounded-lg overflow-hidden border'
        style={{ borderColor, background: 'var(--neutral-warm-surface)' }}
      >
        <Carousel setApi={setApi} options={{ loop: hasMultipleImages }} className='h-full'>
          <CarouselContent className='h-full'>
            {images.map((url, index) => (
              <CarouselItem key={`${url}-${index}`} className='h-full'>
                <Image src={url} alt={title} className='w-full h-full object-cover' />
              </CarouselItem>
            ))}
          </CarouselContent>
          {badge}
          {hasMultipleImages ? (
            <>
              <CarouselPrevious className='left-3 translate-x-0 bg-black/35 border-transparent hover:bg-black/55 [&_svg]:text-white' />
              <CarouselNext className='right-3 translate-x-0 bg-black/35 border-transparent hover:bg-black/55 [&_svg]:text-white' />
              <span className='absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums'>
                {activeImage + 1} / {gallery.length}
              </span>
            </>
          ) : null}
        </Carousel>
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
                <Image src={url} alt='' className='w-full h-full object-cover' />
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
