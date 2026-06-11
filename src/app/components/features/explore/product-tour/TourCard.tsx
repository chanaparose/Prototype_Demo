import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';

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

  const placeAtTop = (() => {
    if (def.cardPlacement === 'top') return true;
    if (def.cardPlacement === 'bottom') return false;
    return !isMock && rect ? rect.top > wh * 0.5 : false;
  })();

  const shadowDir = placeAtTop
    ? '0 6px 40px rgba(0,0,0,0.15)'
    : '0 -6px 40px rgba(0,0,0,0.15)';

  return (
    <div
      key={stepIdx}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        ...(placeAtTop ? { top: 16 } : { bottom: 16 }),
        left: 12,
        right: 12,
        zIndex: 100001,
        maxWidth: 440,
        margin: '0 auto',
        borderRadius: 22,
        /* ── Liquid Glass surface ── */
        background: 'rgba(255, 255, 255, 0.74)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: [
          shadowDir,
          'inset 0 1.5px 0 rgba(255,255,255,0.95)',
          'inset 0 -1px 0 rgba(0,0,0,0.04)',
        ].join(', '),
        padding: '14px 16px 16px',
        animation: 'tour-card-in 0.22s ease-out both',
      }}
    >
      {/* ── Header: icon + title + × close ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
        {/* Emoji icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            background: `${def.badgeColor}18`,
            border: `1px solid ${def.badgeColor}30`,
          }}
        >
          {def.icon}
        </div>

        {/* Title */}
        <p
          style={{
            flex: 1,
            margin: 0,
            paddingTop: 1,
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--brand-ink)',
            lineHeight: 1.35,
          }}
        >
          {def.title}
        </p>

        {/* × close button */}
        <button
          onClick={onClose}
          aria-label='ปิดทัวร์'
          style={{
            width: 26,
            height: 26,
            borderRadius: 99,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.07)',
            border: 'none',
            cursor: 'pointer',
            marginTop: 1,
          }}
        >
          <X size={13} color='var(--neutral-subtle)' />
        </button>
      </div>

      {/* ── Desc (1 sentence, indented under icon) ── */}
      <p
        style={{
          fontSize: 13,
          color: '#4B5563',
          lineHeight: 1.65,
          margin: '0 0 12px',
          paddingLeft: 46,
        }}
      >
        {def.desc}
      </p>

      {/* ── Segmented line progress ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: i <= stepIdx ? def.badgeColor : 'rgba(0,0,0,0.10)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* ── Footer: prev (icon-only) + next/finish ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {!isFirst && (
          <button
            onClick={onPrev}
            aria-label='ย้อนกลับ'
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={15} color='var(--neutral-subtle)' />
          </button>
        )}

        <button
          onClick={isLast ? onClose : onNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 20px',
            borderRadius: 99,
            border: 'none',
            background: def.badgeColor,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${def.badgeColor}55`,
          }}
        >
          {isLast ? (
            'ลองเลย ✨'
          ) : (
            <>
              ถัดไป <ChevronRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
