import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div
      key={stepIdx}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        ...(placeAtTop ? { top: 16 } : { bottom: 16 }),
        left: 12,
        right: 12,
        zIndex: 9999,
        maxWidth: 440,
        margin: '0 auto',
        background: 'var(--neutral-white)',
        borderRadius: 20,
        boxShadow: placeAtTop ? '0 4px 40px rgba(0,0,0,0.28)' : '0 -4px 40px rgba(0,0,0,0.28)',
        overflow: 'visible',
        animation: 'tour-card-in 0.22s ease-out both',
      }}
    >
      <div
        style={{
          height: 4,
          borderRadius: '20px 20px 0 0',
          background: `linear-gradient(90deg, ${def.badgeColor} 0%, var(--brand-purple) 100%)`,
        }}
      />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                background: `${def.badgeColor}18`,
                color: def.badgeColor,
                border: `1px solid ${def.badgeColor}30`,
                display: 'inline-block',
                marginBottom: 4,
              }}
            >
              {def.badge}
            </span>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--brand-ink)',
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {def.title}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, marginBottom: 10 }}>
          {def.desc}
        </p>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: '7px 11px',
            borderRadius: 10,
            marginBottom: 14,
            background: `${def.badgeColor}12`,
            border: `1px solid ${def.badgeColor}25`,
            color: def.badgeColor,
          }}
        >
          {def.tip}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === stepIdx ? def.badgeColor : 'var(--neutral-border)',
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {!isFirst ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={onPrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 13px',
                  borderRadius: 99,
                  border: '1.5px solid var(--neutral-border)',
                  background: 'transparent',
                  color: 'var(--neutral-subtle)',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={13} /> ย้อนกลับ
              </Button>
            ) : (
              <Button
                variant='unstyled'
                type='button'
                onClick={onClose}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 13px',
                  borderRadius: 99,
                  border: '1.5px solid var(--neutral-border)',
                  background: 'transparent',
                  color: 'var(--neutral-subtle)',
                  cursor: 'pointer',
                }}
              >
                ข้ามทัวร์
              </Button>
            )}
            <Button
              variant='unstyled'
              type='button'
              onClick={isLast ? onClose : onNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                padding: '7px 18px',
                borderRadius: 99,
                border: 'none',
                background: def.badgeColor,
                color: 'var(--neutral-white)',
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${def.badgeColor}55`,
              }}
            >
              {isLast ? (
                'เริ่มเลย 🎉'
              ) : (
                <>
                  ถัดไป <ChevronRight size={13} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
