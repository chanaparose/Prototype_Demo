import React, { useState, useEffect } from 'react';
import { Copy, Gift } from 'lucide-react';
import { PROMO_SLIDES } from './constants';

type ExplorePromoCarouselProps = {
  initialIndex?: number;
  onCopyCode?: (code: string, id: string) => void;
};

export function ExplorePromoCarousel({
  initialIndex = 0,
  onCopyCode,
}: ExplorePromoCarouselProps) {
  const [promoIndex, setPromoIndex] = useState(initialIndex);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onCopyCode?.(code, id);
  };

  return (
    <div className="relative mb-6 overflow-hidden -mx-4">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{
          paddingLeft: 'calc(50% - (min(85vw, 340px) / 2))',
          paddingRight: 'calc(50% - (min(85vw, 340px) / 2))',
          gap: '12px',
          transform: `translateX(calc(-${promoIndex} * (min(85vw, 340px) + 12px)))`,
        }}
      >
        {PROMO_SLIDES.map((promo) => (
          <div
            key={promo.id}
            className="flex-shrink-0 w-[85vw] max-w-[340px] rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="relative overflow-hidden rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #F28A2E 0%, #F27830 100%)' }}>
              {/* Purple ribbon accent (top-right) */}
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-30" style={{ background: '#A238FF' }} />
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 blur-xl" style={{ background: '#A238FF' }} />
              {/* Cream/light circle (bottom-left) */}
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#FAEBD7' }} />
              <div className="relative z-10">
                {/* Purple ribbon badge */}
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
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`สไลด์ ${i + 1}`}
            onClick={() => setPromoIndex(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={i === promoIndex ? { width: '20px', background: '#F28A2E' } : { width: '6px', background: '#D1D5DB' }}
          />
        ))}
      </div>
    </div>
  );
}
