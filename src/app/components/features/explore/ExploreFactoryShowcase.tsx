import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import { ImageWithFallback } from '../../shared';
import type { FactoryItem } from './ExploreFactoryGrid';
import { formatCompactNumber } from '@/utils/formatting';

type Props = {
  factories: FactoryItem[];
  onFactoryClick: (id: string) => void;
  onSeeAll?: () => void;
  /** Layout density. `'mobile'` shows ~1.1 cards, `'desktop'` ~1.5–2 cards. */
  variant?: 'mobile' | 'desktop';
};

/**
 * Horizontal scrolling factory cards inspired by hospital marketing layout —
 * text content on the LEFT, hero image clipped on the RIGHT, on a soft
 * pastel background. Replaces the previous dark gradient banner section.
 */
export function ExploreFactoryShowcase({
  factories,
  onFactoryClick,
  onSeeAll,
  variant = 'mobile',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const items = factories ?? [];

  const cardWidth = variant === 'desktop' ? 480 : 320;
  const gap = 16;
  const step = cardWidth + gap;

  const scrollTo = useCallback(
    (idx: number) => {
      if (!scrollRef.current || items.length === 0) return;
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      setActiveIdx(clamped);
      scrollRef.current.scrollTo({ left: clamped * step, behavior: 'smooth' });
    },
    [items.length, step],
  );

  // Auto-rotate
  useEffect(() => {
    if (items.length <= 1) return;
    const t = window.setInterval(() => {
      if (hoveredRef.current) return;
      setActiveIdx((prev) => {
        const next = (prev + 1) % items.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ left: next * step, behavior: 'smooth' });
        }
        return next;
      });
    }, 4500);
    return () => window.clearInterval(t);
  }, [items.length, step]);

  // Sync active dot from manual scroll
  const onScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const left = scrollRef.current.scrollLeft;
    const idx = Math.round(left / step);
    setActiveIdx(Math.max(0, Math.min(idx, items.length - 1)));
  }, [step, items.length]);

  if (items.length === 0) return null;

  // Card pastel palettes — rotate per card for visual variety (Tryly brand colors)
  const palettes = [
    { bg: '#F5F3FF', accent: '#A238FF', chip: '#EDE4FF', chipText: '#6D28D9' },
    { bg: '#FFF4E8', accent: '#F28A2E', chip: '#FFE6CB', chipText: '#C2410C' },
    { bg: '#ECFDF5', accent: '#0D9488', chip: '#D1FAE5', chipText: '#047857' },
    { bg: '#FFF1F5', accent: '#E11D48', chip: '#FCE7F0', chipText: '#9D174D' },
  ];

  return (
    <section
      className="mx-4 mb-3 mt-3"
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      {/* Section title — light, no gradient banner */}
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <h2 className="text-base lg:text-xl font-bold text-[#1A0A2E]">โรงงานแนะนำ</h2>
          <p className="text-[11px] lg:text-xs text-gray-500 mt-0.5">
            โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าคุณภาพสูง
          </p>
        </div>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="shrink-0 inline-flex items-center gap-0.5 text-[11px] lg:text-xs font-medium text-[#A238FF] hover:underline"
          >
            ดูทั้งหมด <ArrowRight size={12} />
          </button>
        ) : null}
      </div>

      {/* Horizontal scroller */}
      <div className="relative">
        {variant === 'desktop' && items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(activeIdx + 1)}
              disabled={activeIdx >= items.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="ถัดไป"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((factory, i) => {
            const palette = palettes[i % palettes.length];
            return (
              <button
                type="button"
                key={factory.id}
                onClick={() => onFactoryClick(factory.id)}
                className="snap-start shrink-0 rounded-2xl overflow-hidden text-left relative hover:shadow-lg transition-shadow group"
                style={{
                  width: cardWidth,
                  height: variant === 'desktop' ? 220 : 180,
                  background: palette.bg,
                }}
              >
                {/* Image — right side, takes ~45-50% width with rounded clip */}
                <div
                  className="absolute top-0 right-0 bottom-0 overflow-hidden"
                  style={{
                    width: variant === 'desktop' ? '52%' : '46%',
                    borderRadius: '50% 0 0 50% / 50% 0 0 50%',
                  }}
                >
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Verified badge floating on image */}
                {factory.verified ? (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                    <BadgeCheck size={12} style={{ color: palette.accent }} />
                    <span className="text-[10px] font-semibold" style={{ color: palette.accent }}>
                      ยืนยัน
                    </span>
                  </div>
                ) : null}

                {/* Text content — left side */}
                <div
                  className="relative z-[1] flex flex-col justify-between h-full p-4"
                  style={{ width: variant === 'desktop' ? '55%' : '58%' }}
                >
                  <div>
                    <div
                      className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-semibold mb-1.5"
                      style={{ color: palette.accent }}
                    >
                      <MapPin size={10} />
                      {factory.location || 'โรงงาน'}
                    </div>
                    <h3
                      className="font-bold text-[#1A0A2E] mb-1.5 leading-tight line-clamp-2"
                      style={{ fontSize: variant === 'desktop' ? 18 : 15 }}
                    >
                      {factory.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-gray-600 mb-2">
                      <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                      <span className="font-semibold">{factory.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({factory.reviews} รีวิว)</span>
                    </div>
                    <p
                      className="text-[10px] lg:text-[11px] text-gray-600 leading-snug line-clamp-2"
                    >
                      ขั้นต่ำ <span className="font-semibold text-gray-800">{formatCompactNumber(factory.minOrder)}</span> ชิ้น
                    </p>
                  </div>

                  <div
                    className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-bold rounded-full px-3 py-1.5 self-start"
                    style={{ background: palette.chip, color: palette.chipText }}
                  >
                    ดูรายละเอียด <ArrowRight size={10} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      {items.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={`fac-dot-${i}`}
              type="button"
              onClick={() => scrollTo(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: activeIdx === i ? 18 : 6,
                backgroundColor: activeIdx === i ? '#A238FF' : '#D6D3E6',
              }}
              aria-label={`ไปที่ลำดับ ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
