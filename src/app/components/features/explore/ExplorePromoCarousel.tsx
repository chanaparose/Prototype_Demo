import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Copy, Gift } from 'lucide-react';

type Slide = { id: string; title: string; subtitle: string; code: string };

type ExplorePromoCarouselProps = {
  initialIndex?: number;
  onCopyCode?: (code: string, id: string) => void;
  /** Promo slides จาก API เท่านั้น — ไม่มี fallback */
  promoSlides?: unknown[];
  /** Promo codes จาก API — merge เข้า slides */
  promoCodes?: unknown[];
};

/** Normalise API promo-slide or promo-code objects into a flat Slide shape */
function toSlides(raw: unknown[]): Slide[] {
  return raw
    .map((item) => {
      const r = item as Record<string, unknown>;
      return {
        id: String(r.slide_id ?? r.id ?? ''),
        title: String(r.title ?? ''),
        subtitle: String(r.subtitle ?? ''),
        code: String(r.code ?? ''),
      };
    })
    .filter((s) => s.id && s.title);
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

  const [promoIndex, setPromoIndex] = useState(initialIndex);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const GAP = 12;
  const PADDING = 16;

  const updateSlideWidth = useCallback(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.offsetWidth;
      setSlideWidth(Math.min(containerW - PADDING * 2, 340));
    }
  }, []);

  useEffect(() => {
    updateSlideWidth();
    window.addEventListener('resize', updateSlideWidth);
    return () => window.removeEventListener('resize', updateSlideWidth);
  }, [updateSlideWidth]);

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setPromoIndex((i) => (i + 1) % slides.length);
    }, 4000);
  }, [slides.length]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [startAutoPlay]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    touchCurrentX.current = e.touches[0].clientX;
    setDragOffset(touchCurrentX.current - touchStartX.current);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const diff = touchCurrentX.current - touchStartX.current;
    const threshold = 50;

    if (diff < -threshold && promoIndex < slides.length - 1) {
      setPromoIndex((i) => i + 1);
    } else if (diff > threshold && promoIndex > 0) {
      setPromoIndex((i) => i - 1);
    }

    setIsDragging(false);
    setDragOffset(0);
    startAutoPlay();
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onCopyCode?.(code, id);
  };

  const translateX = -(promoIndex * (slideWidth + GAP)) + (isDragging ? dragOffset : 0);

  if (slides.length === 0) return null;

  return (
    <div ref={containerRef} className="relative mb-6 w-full overflow-hidden">
      <div
        className="flex"
        style={{
          paddingLeft: `${PADDING}px`,
          paddingRight: `${PADDING}px`,
          gap: `${GAP}px`,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 500ms ease-out',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((promo) => (
          <div
            key={promo.id}
            className="flex-shrink-0 rounded-2xl overflow-hidden shadow-lg"
            style={{ width: slideWidth || 'auto' }}
          >
            <div className="relative overflow-hidden rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #F28A2E 0%, #F27830 100%)' }}>
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-30" style={{ background: '#A238FF' }} />
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 blur-xl" style={{ background: '#A238FF' }} />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#FAEBD7' }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2" style={{ background: '#A238FF' }}>
                  <Gift className="w-3.5 h-3.5 text-white" />
                  <span style={{ fontSize: 11 }} className="text-white font-semibold tracking-wide">
                    โปรโมชั่นพิเศษ!
                  </span>
                </div>
                <p style={{ fontSize: 18 }} className="mb-1 font-bold text-white drop-shadow-sm">
                  {promo.title}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }} className="mb-3 leading-snug">
                  {promo.subtitle}
                </p>
                {promo.code && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-1.5 border" style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.40)' }}>
                      <span style={{ fontSize: 15, letterSpacing: 2 }} className="font-mono font-bold text-white">{promo.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(promo.code, promo.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors font-semibold"
                      style={{ background: '#2D1B4E', color: 'white', fontSize: 13 }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === promo.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`สไลด์ ${i + 1}`}
            onClick={() => {
              setPromoIndex(i);
              startAutoPlay();
            }}
            className="h-1.5 rounded-full transition-all duration-300"
            style={i === promoIndex ? { width: '20px', background: '#F28A2E' } : { width: '6px', background: '#D1D5DB' }}
          />
        ))}
      </div>
    </div>
  );
}
