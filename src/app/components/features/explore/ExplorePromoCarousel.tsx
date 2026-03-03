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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-4 text-white">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5" />
                  <span style={{ fontSize: 13 }} className="opacity-90">
                    โปรโมชั่นพิเศษ!
                  </span>
                </div>
                <p style={{ fontSize: 18 }} className="mb-1 font-bold">
                  {promo.title}
                </p>
                <p style={{ fontSize: 12 }} className="opacity-80 mb-3">
                  {promo.subtitle}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30">
                    <span style={{ fontSize: 15, letterSpacing: 2 }}>{promo.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(promo.code, promo.id)}
                    className="flex items-center gap-1.5 bg-white text-purple-600 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors"
                    style={{ fontSize: 13 }}
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
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === promoIndex ? 'w-5 bg-[#6C47FF]' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
