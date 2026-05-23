import React, { useMemo, useState } from 'react';
import { Copy, Gift } from 'lucide-react';
import { mapExplorePromoSlides } from '@/domain/explore/mappers/mapExplorePromo';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel';

type Slide = { id: string; title: string; subtitle: string; code: string };

type ExplorePromoCarouselProps = {
  initialIndex?: number;
  onCopyCode?: (code: string, id: string) => void;
  promoSlides?: unknown[];
  promoCodes?: unknown[];
};

function toSlides(raw: unknown[]): Slide[] {
  return mapExplorePromoSlides(raw);
}

export function ExplorePromoCarousel({
  initialIndex = 0,
  onCopyCode,
  promoSlides = [],
  promoCodes = [],
}: ExplorePromoCarouselProps) {
  // Merge API slides + codes — ไม่มี fallback ไป mock data
  const slides: Slide[] = useMemo(() => {
    const apiSlides = toSlides(promoSlides);
    const apiCodes = toSlides(promoCodes);
    return [...apiSlides, ...apiCodes];
  }, [promoSlides, promoCodes]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onCopyCode?.(code, id);
  };

  if (slides.length === 0) return null;

  return (
    <Carousel
      className='relative mb-3 w-full overflow-hidden'
      options={{ align: 'center', loop: slides.length > 1, startIndex: initialIndex }}
      autoPlayMs={4000}
    >
      <CarouselContent className='gap-2.5 px-3'>
        {slides.map((promo) => (
          <CarouselItem
            key={promo.id}
            className='basis-[min(calc(100%-24px),340px)] rounded-2xl overflow-hidden shadow-lg'
          >
            <div className='relative overflow-hidden rounded-2xl p-3 text-white bg-[linear-gradient(135deg,var(--brand-orange)_0%,var(--brand-orange-vivid)_100%)]'>
              <div className='absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-30 bg-brand-purple' />
              <div className='absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 blur-xl bg-brand-purple' />
              <div className='absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-20 bg-[#FAEBD7]' />
              <div className='relative z-10'>
                <div className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mb-1.5 bg-brand-purple'>
                  <Gift className='w-3 h-3 text-white' />
                  <span className='text-[11px] text-white font-semibold tracking-wide'>
                    โปรโมชั่นพิเศษ!
                  </span>
                </div>
                <p className='mb-1 text-[15px] font-bold text-white drop-shadow-sm'>
                  {promo.title}
                </p>
                <p className='mb-2.5 text-xs text-white/85 leading-snug'>{promo.subtitle}</p>
                {promo.code && (
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-1.5 border bg-white/25 border-white/40'>
                      <span className='text-[15px] tracking-[2px] font-mono font-bold text-white'>
                        {promo.code}
                      </span>
                    </div>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => handleCopy(promo.code, promo.id)}
                      className='flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors font-semibold bg-brand-navy-deep text-white text-[13px]'
                    >
                      <Copy className='w-3.5 h-3.5' />
                      {copiedId === promo.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselDots className='mt-4' />
    </Carousel>
  );
}
