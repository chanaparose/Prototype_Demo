import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { cn } from '@lib/utils';

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

type CarouselContextValue = {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  selectedIndex: number;
  scrollSnaps: number[];
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within <Carousel>');
  }
  return context;
}

type CarouselProps = React.ComponentProps<'div'> & {
  options?: CarouselOptions;
  autoPlayMs?: number;
  pauseOnHover?: boolean;
  setApi?: (api: CarouselApi) => void;
};

function Carousel({
  className,
  options,
  autoPlayMs,
  pauseOnHover = true,
  setApi,
  children,
  ...props
}: CarouselProps) {
  const [viewportRef, api] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const hoveredRef = React.useRef(false);

  const updateState = React.useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return;
    setSelectedIndex(carouselApi.selectedScrollSnap());
    setScrollSnaps(carouselApi.scrollSnapList());
    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!api) return;
    setApi?.(api);
    updateState(api);
    api.on('select', updateState);
    api.on('reInit', updateState);
    return () => {
      api.off('select', updateState);
      api.off('reInit', updateState);
    };
  }, [api, setApi, updateState]);

  useEffect(() => {
    if (!api || !autoPlayMs || autoPlayMs <= 0 || scrollSnaps.length <= 1) return;
    const timer = window.setInterval(() => {
      if (pauseOnHover && hoveredRef.current) return;
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [api, autoPlayMs, pauseOnHover, scrollSnaps.length]);

  const value = React.useMemo<CarouselContextValue>(
    () => ({
      viewportRef,
      api,
      selectedIndex,
      scrollSnaps,
      canScrollPrev,
      canScrollNext,
      scrollPrev: () => api?.scrollPrev(),
      scrollNext: () => api?.scrollNext(),
      scrollTo: (index: number) => api?.scrollTo(index),
    }),
    [api, canScrollNext, canScrollPrev, scrollSnaps, selectedIndex, viewportRef],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        data-slot='carousel'
        className={cn('relative', className)}
        onMouseEnter={() => {
          hoveredRef.current = true;
        }}
        onMouseLeave={() => {
          hoveredRef.current = false;
        }}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { viewportRef } = useCarousel();
  return (
    <div ref={viewportRef} data-slot='carousel-viewport' className='overflow-hidden'>
      <div data-slot='carousel-content' className={cn('flex touch-pan-y', className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='carousel-item'
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  );
}

type CarouselButtonProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  label?: string;
};

function CarouselPrevious({ className, label = 'ก่อนหน้า', ...props }: CarouselButtonProps) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      variant='unstyled'
      type='button'
      aria-label={label}
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        'absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30',
        className,
      )}
      {...props}
    >
      <ChevronLeft size={18} className='text-gray-600' />
    </Button>
  );
}

function CarouselNext({ className, label = 'ถัดไป', ...props }: CarouselButtonProps) {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      variant='unstyled'
      type='button'
      aria-label={label}
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        'absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30',
        className,
      )}
      {...props}
    >
      <ChevronRight size={18} className='text-gray-600' />
    </Button>
  );
}

function CarouselDots({ className, dotClassName }: { className?: string; dotClassName?: string }) {
  const { scrollSnaps, selectedIndex, scrollTo } = useCarousel();
  if (scrollSnaps.length <= 1) return null;

  return (
    <div className={cn('flex justify-center gap-1.5', className)}>
      {scrollSnaps.map((_, index) => (
        <Button
          variant='unstyled'
          key={index}
          type='button'
          aria-label={`สไลด์ ${index + 1}`}
          onClick={() => scrollTo(index)}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            index === selectedIndex ? 'w-6 bg-brand-orange' : 'w-1.5 bg-gray-300',
            dotClassName,
          )}
        />
      ))}
    </div>
  );
}

type CarouselLightboxProps = {
  images: string[];
  openIndex: number | null;
  alt?: string;
  onClose: () => void;
};

function CarouselLightbox({ images, openIndex, alt = '', onClose }: CarouselLightboxProps) {
  const [api, setApi] = React.useState<CarouselApi>();

  useEffect(() => {
    if (!api || openIndex == null) return;
    api.scrollTo(openIndex);
  }, [api, openIndex]);

  if (openIndex == null || !images[openIndex]) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
      onClick={onClose}
    >
      <Button
        variant='unstyled'
        className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/25'
        onClick={onClose}
        type='button'
        aria-label='ปิด'
      >
        <X size={20} />
      </Button>
      <Carousel
        setApi={setApi}
        options={{ loop: images.length > 1, startIndex: openIndex }}
        className='w-full max-w-5xl'
        onClick={(event) => event.stopPropagation()}
      >
        <CarouselContent>
          {images.map((src, index) => (
            <CarouselItem key={`${src}-${index}`} className='flex items-center justify-center'>
              <Image
                src={src}
                alt={alt}
                loading='eager'
                className='max-h-[85vh] max-w-full rounded-2xl object-contain'
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 ? (
          <>
            <CarouselPrevious className='left-4 translate-x-0 border-white/20 bg-white/15 hover:bg-white/25 [&_svg]:text-white' />
            <CarouselNext className='right-4 translate-x-0 border-white/20 bg-white/15 hover:bg-white/25 [&_svg]:text-white' />
            <CarouselDots className='mt-4' dotClassName='bg-white/40' />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselLightbox,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
};
export type { CarouselApi, CarouselOptions };
