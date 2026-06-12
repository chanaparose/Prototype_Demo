import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';
import { tourAccent, TOUR_THEME } from '@/components/features/explore/product-tour/tourTheme';
import { LiquidGlassSurface } from '@/components/ui/liquid-glass-surface';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

export function TourCard({
  stepIdx,
  def,
  total,
  rect,
  isMock,
  onPrev,
  onNext,
  onClose,
}: {
  stepIdx: number;
  def: TourStepDef;
  total: number;
  rect: DOMRect | null;
  isMock: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;
  const wh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const accent = tourAccent(def.badgeColor);

  const placeAtTop = (() => {
    if (def.cardPlacement === 'top') return true;
    if (def.cardPlacement === 'bottom') return false;
    return !isMock && rect ? rect.top > wh * 0.5 : false;
  })();

  return (
    <LiquidGlassSurface
      filterId='tour-card-glass'
      tone='tour'
      key={stepIdx}
      onClick={(e) => e.stopPropagation()}
      className='fixed left-3 right-3 z-[100001] mx-auto max-w-[440px] rounded-[22px] px-4 pb-4 pt-3.5'
      style={{
        ...(placeAtTop ? { top: 16 } : { bottom: 16 }),
        animation: 'tour-card-in 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        boxShadow: placeAtTop ? TOUR_THEME.cardShadow : TOUR_THEME.cardShadowUp,
      }}
    >
      {/* ── Header: icon + title + close ── */}
      <div className='mb-2.5 flex items-start gap-2.5'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[19px]'
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 16%, white), color-mix(in srgb, ${accent} 8%, white))`,
            border: `1px solid color-mix(in srgb, ${accent} 28%, white)`,
            boxShadow: `0 4px 14px color-mix(in srgb, ${accent} 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.9)`,
          }}
        >
          {def.icon}
        </div>

        <p
          className='m-0 min-w-0 flex-1 pt-1.5 text-[15px] font-bold leading-snug'
          style={{ color: TOUR_THEME.title }}
        >
          {def.title}
        </p>

        <LiquidButton
          type='button'
          variant='ghost'
          size='icon'
          filterId='tour-close-glass'
          onClick={onClose}
          aria-label='ปิดทัวร์'
          className='mt-px size-[26px] min-h-0 rounded-full text-slate-500'
        >
          <X size={13} />
        </LiquidButton>
      </div>

      {/* ── Desc ── */}
      <p
        className='mb-3.5 text-[13px] leading-relaxed'
        style={{ color: TOUR_THEME.body }}
      >
        {def.desc}
      </p>

      {/* ── Segmented progress ── */}
      <div className='mb-3.5 flex gap-1.5'>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className='h-1 flex-1 rounded-full transition-all duration-300'
            style={{
              background: i <= stepIdx ? accent : TOUR_THEME.progressInactive,
              boxShadow: i === stepIdx ? `0 0 8px color-mix(in srgb, ${accent} 45%, transparent)` : undefined,
              transform: i === stepIdx ? 'scaleY(1.15)' : undefined,
            }}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className='flex justify-end gap-2'>
        {!isFirst ? (
          <LiquidButton
            type='button'
            variant='ghost'
            size='icon'
            filterId='tour-prev-glass'
            onClick={onPrev}
            aria-label='ย้อนกลับ'
            className='text-slate-600'
          >
            <ChevronLeft size={15} />
          </LiquidButton>
        ) : null}

        <LiquidButton
          type='button'
          variant='primary'
          size='default'
          tint={accent}
          filterId='tour-next-glass'
          onClick={onNext}
          className='min-w-[7.5rem] px-5 shadow-none'
        >
          {isLast ? (
            'ลองเลย ✨'
          ) : (
            <>
              ถัดไป <ChevronRight size={13} />
            </>
          )}
        </LiquidButton>
      </div>
    </LiquidGlassSurface>
  );
}
