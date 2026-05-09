import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const TOUR_KEY = 'tryly_tour_seen_v1';

/* ─── CSS ──────────────────────────────────────────────────────────────────── */
const TOUR_CSS = `
@keyframes tour-card-in {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes tour-ring-pulse {
  0%,100% { stroke-width:2.5; stroke-opacity:0.85; }
  50%      { stroke-width:4.5; stroke-opacity:1; }
}
.tour-ring { animation: tour-ring-pulse 1.8s ease-in-out infinite; }
`;
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = TOUR_CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

/* ─── Types ────────────────────────────────────────────────────────────────── */
type StepDef = {
  route: string;
  /** Text content to find the spotlight element (tries each in order) */
  targetTexts?: string[];
  /** CSS selector fallback */
  targetSelector?: string;
  spotlightRadius?: number;
  spotlightPad?: number;
  badgeColor: string;
  icon: string;
  badge: string;
  title: string;
  desc: string;
  tip: string;
};

/* ─── Step definitions ─────────────────────────────────────────────────────── */
const STEPS: StepDef[] = [
  {
    route: '/factory-ideas',
    targetTexts: ['สินค้า', 'ทั้งหมด'],
    spotlightRadius: 24,
    spotlightPad: 6,
    badgeColor: '#A238FF',
    icon: '🔍',
    badge: 'ขั้นตอนที่ 1 / 6',
    title: 'เลือกดูสินค้าและโรงงาน',
    desc: 'เลือกดูสินค้าตัวอย่าง วัตถุดิบ และโรงงานที่สนใจ กรองตามหมวดหมู่ tab ด้านบน หรือค้นหาโดยตรงได้เลย',
    tip: '💡 กด tab "สินค้า" เพื่อดูตัวอย่างที่โรงงานเคยผลิต',
  },
  {
    route: '/create-rfq',
    targetTexts: ['ส่งคำขอราคา', 'สร้างคำขอ', 'ผลิตสินค้า'],
    targetSelector: 'form, [data-testid="rfq-form"]',
    spotlightRadius: 14,
    spotlightPad: 8,
    badgeColor: '#F28A2E',
    icon: '📋',
    badge: 'ขั้นตอนที่ 2 / 6',
    title: 'ส่งคำขอราคา (RFQ) ฟรี',
    desc: 'กรอกข้อมูลสินค้าที่ต้องการผลิต เช่น ผลิตตัวอย่าง หรือ ขอตัวอย่างวัตถุดิบ ระบบจะส่ง order ของคุณให้ทุกโรงงานในหมวดหมู่นั้น',
    tip: '📋 ยิ่งกรอกละเอียด ยิ่งได้ราคาที่แม่นยำ',
  },
  {
    route: '/product-detail',
    targetTexts: ['แชทกับโรงงาน', 'Chat', 'แชท'],
    spotlightRadius: 12,
    spotlightPad: 6,
    badgeColor: '#0D9488',
    icon: '💬',
    badge: 'ขั้นตอนที่ 3 / 6',
    title: 'แชทกับโรงงานที่สนใจ',
    desc: 'กดปุ่ม "แชทกับโรงงาน" เพื่อคุยรายละเอียดเพิ่มเติมโดยตรง ปรับแบบ ขอตัวอย่าง หรือต่อรองราคาได้เลย',
    tip: '💬 โรงงานใน Tryly ทุกรายพร้อมตอบกลับภายใน 24 ชม.',
  },
  {
    route: '/messages',
    targetTexts: ['พิมพ์ข้อความ', 'ส่งข้อความ', 'แนบ RFQ'],
    targetSelector: 'input[placeholder], textarea',
    spotlightRadius: 12,
    spotlightPad: 6,
    badgeColor: '#3B82F6',
    icon: '📩',
    badge: 'ขั้นตอนที่ 4 / 6',
    title: 'ส่ง RFQ ให้โรงงานใน Chat',
    desc: 'แนบคำขอราคาที่สร้างไว้ในห้องแชทเพื่อสอบถามว่าโรงงานนี้รับผลิตหรือไม่ และรอรับใบเสนอราคากลับมา',
    tip: '📩 โรงงานจะส่งใบเสนอราคาผ่าน Chat และในหน้า RFQ',
  },
  {
    route: '/rfqs/28',
    targetTexts: ['ยอมรับข้อเสนอ', 'ยอมรับ', 'เปรียบเทียบ'],
    spotlightRadius: 14,
    spotlightPad: 8,
    badgeColor: '#7C3AED',
    icon: '⚖️',
    badge: 'ขั้นตอนที่ 5 / 6',
    title: 'เปรียบเทียบและยอมรับข้อเสนอ',
    desc: 'ดูรายละเอียดใบเสนอราคาจากหลายโรงงาน เปรียบเทียบราคา เงื่อนไข และยอมรับข้อเสนอได้หลายออเดอร์',
    tip: '⚖️ เลือกได้มากกว่า 1 โรงงาน เพื่อเปรียบเทียบตัวอย่างก่อนตัดสินใจ',
  },
  {
    route: '/orders/17',
    targetTexts: ['ชำระเงิน', 'จ่ายเงิน', 'มัดจำ'],
    spotlightRadius: 12,
    spotlightPad: 6,
    badgeColor: '#22C55E',
    icon: '✅',
    badge: 'ขั้นตอนที่ 6 / 6',
    title: 'จ่ายเงินและติดตามสถานะ',
    desc: 'ดูรายละเอียดคำสั่งซื้อ ชำระเงินมัดจำผ่านระบบ Escrow ที่ปลอดภัย แล้วติดตามสถานะการผลิตจนถึงมือคุณ',
    tip: '🔒 เงินจะโอนให้โรงงานเมื่อคุณรับสินค้าแล้วเท่านั้น',
  },
];

/* ─── Find target element ────────────────────────────────────────────────────
   Searches by visible text then CSS selector. Returns null if nothing found.
   ─────────────────────────────────────────────────────────────────────────── */
function findTarget(def: StepDef): Element | null {
  // 1. Search by text inside buttons / links / interactive elements
  if (def.targetTexts) {
    for (const text of def.targetTexts) {
      const matches = Array.from(
        document.querySelectorAll('button, a, [role="button"], [role="tab"], input')
      );
      const found = matches.find(
        (el) => el.textContent?.trim().includes(text) || (el as HTMLInputElement).placeholder?.includes(text)
      );
      if (found) return found;
    }
  }
  // 2. CSS selector fallback
  if (def.targetSelector) {
    const el = document.querySelector(def.targetSelector);
    if (el) return el;
  }
  return null;
}

/* ─── SVG spotlight overlay ──────────────────────────────────────────────────
   Creates a dark overlay with a transparent "hole" over the target element.
   ─────────────────────────────────────────────────────────────────────────── */
function SpotlightOverlay({
  rect,
  color,
  radius,
  onClickOutside,
}: {
  rect: DOMRect | null;
  color: string;
  radius: number;
  onClickOutside: () => void;
}) {
  const PAD = 8;
  const uniqueId = `tour-mask-${color.replace('#', '')}`;

  return (
    <svg
      onClick={onClickOutside}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'all',
        cursor: 'default',
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        <mask id={uniqueId}>
          <rect width="100%" height="100%" fill="white" />
          {rect && (
            <rect
              x={rect.left - PAD}
              y={rect.top - PAD}
              width={rect.width + PAD * 2}
              height={rect.height + PAD * 2}
              rx={radius}
              fill="black"
            />
          )}
        </mask>
      </defs>
      {/* Dark overlay */}
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.70)"
        mask={`url(#${uniqueId})`}
      />
      {/* Colored pulsing ring around spotlight */}
      {rect && (
        <rect
          className="tour-ring"
          x={rect.left - PAD}
          y={rect.top - PAD}
          width={rect.width + PAD * 2}
          height={rect.height + PAD * 2}
          rx={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
      )}
    </svg>
  );
}

/* ─── Tooltip card ───────────────────────────────────────────────────────────
   Positioned at bottom of screen. Arrow direction depends on rect position.
   ─────────────────────────────────────────────────────────────────────────── */
function TourCard({
  stepIdx,
  def,
  total,
  rect,
  onPrev,
  onNext,
  onClose,
}: {
  stepIdx: number;
  def: StepDef;
  total: number;
  rect: DOMRect | null;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;

  // Arrow points UP if rect is above center, DOWN if below center
  const wh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const arrowUp = rect ? rect.bottom < wh * 0.55 : false;

  return (
    <div
      key={stepIdx}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 12,
        right: 12,
        zIndex: 9999,
        maxWidth: 440,
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 -4px 40px rgba(0,0,0,0.28)',
        overflow: 'visible',
        animation: 'tour-card-in 0.22s ease-out both',
      }}
    >
      {/* Arrow pointing up to element (when element is above card) */}
      {arrowUp && rect && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: Math.min(Math.max(rect.left + rect.width / 2 - 24, 20), (typeof window !== 'undefined' ? window.innerWidth : 400) - 60),
          width: 0, height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderBottom: `12px solid ${def.badgeColor}`,
          marginBottom: -1,
          pointerEvents: 'none',
        }} />
      )}

      {/* Colored top strip */}
      <div style={{
        height: 4,
        borderRadius: '20px 20px 0 0',
        background: `linear-gradient(90deg, ${def.badgeColor} 0%, #A238FF 100%)`,
      }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Badge + Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            background: `${def.badgeColor}18`,
            border: `1px solid ${def.badgeColor}30`,
          }}>{def.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: `${def.badgeColor}18`, color: def.badgeColor,
              border: `1px solid ${def.badgeColor}30`,
              display: 'inline-block', marginBottom: 4,
            }}>{def.badge}</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A0A2E', lineHeight: 1.3, margin: 0 }}>
              {def.title}
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, marginBottom: 10 }}>
          {def.desc}
        </p>

        {/* Tip */}
        <div style={{
          fontSize: 11.5, fontWeight: 600,
          padding: '7px 11px', borderRadius: 10, marginBottom: 14,
          background: `${def.badgeColor}12`,
          border: `1px solid ${def.badgeColor}25`,
          color: def.badgeColor,
        }}>
          {def.tip}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width: i === stepIdx ? 20 : 6, height: 6, borderRadius: 99,
                background: i === stepIdx ? def.badgeColor : '#E5E7EB',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 7 }}>
            {!isFirst ? (
              <button type="button" onClick={onPrev} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 99,
                border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer',
              }}>
                <ChevronLeft size={13} /> ย้อนกลับ
              </button>
            ) : (
              <button type="button" onClick={onClose} style={{
                fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 99,
                border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer',
              }}>
                ข้ามทัวร์
              </button>
            )}
            <button type="button" onClick={isLast ? onClose : onNext} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 700, padding: '7px 18px', borderRadius: 99,
              border: 'none', background: def.badgeColor, color: '#FFFFFF', cursor: 'pointer',
              boxShadow: `0 4px 14px ${def.badgeColor}55`,
            }}>
              {isLast ? 'เริ่มเลย 🎉' : (<>ถัดไป <ChevronRight size={13} /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [autoShown, setAutoShown] = useState(false);
  const originPath = useRef('/');

  injectCSS();

  // Auto-open on first visit to explore page
  useEffect(() => {
    if (autoShown || open) return;
    if (location.pathname !== '/') return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      const t = setTimeout(() => { setOpen(true); setAutoShown(true); }, 1200);
      return () => clearTimeout(t);
    }
    setAutoShown(true);
  }, [autoShown, open, location.pathname]);

  // Listen for manual trigger (HOW IT WORKS button)
  useEffect(() => {
    const handler = () => {
      originPath.current = location.pathname;
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('tryly-open-tour', handler);
    return () => window.removeEventListener('tryly-open-tour', handler);
  }, [location.pathname]);

  // Navigate to step's route when step changes
  useEffect(() => {
    if (!open) return;
    const def = STEPS[step];
    if (location.pathname !== def.route) {
      navigate(def.route);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // After navigation lands, find and highlight the target element
  useEffect(() => {
    if (!open) return;
    const def = STEPS[step];
    if (location.pathname !== def.route) { setTargetRect(null); return; }

    // Give page time to fully render
    const t = setTimeout(() => {
      const el = findTarget(def);
      if (!el) { setTargetRect(null); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
      }, 350);
    }, 700);
    return () => clearTimeout(t);
  }, [open, step, location.pathname]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setOpen(false);
    setTargetRect(null);
    // Navigate back to where user was before tour
    if (location.pathname !== originPath.current) {
      navigate(originPath.current);
    }
  }, [location.pathname, navigate]);

  const handleFinish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setOpen(false);
    setTargetRect(null);
    // Stay on current page (last step page)
  }, []);

  const handleNext = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!open) return null;

  const def = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <SpotlightOverlay
        rect={targetRect}
        color={def.badgeColor}
        radius={def.spotlightRadius ?? 12}
        onClickOutside={handleClose}
      />
      <TourCard
        key={step}
        stepIdx={step}
        def={def}
        total={STEPS.length}
        rect={targetRect}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        onClose={handleClose}
      />
    </>
  );
}
