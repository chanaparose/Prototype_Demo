import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  FileText,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Rocket,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import {
  HOW_TO_ORDER_MEDIA,
  type HowToOrderTabId,
} from '@/components/features/explore/exploreMediaConfig';

const ANIMATION_CSS = `
@keyframes hiw-float-a {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(20px,-24px) scale(1.08); }
  66%      { transform: translate(-14px,16px) scale(0.95); }
}
@keyframes hiw-float-b {
  0%,100% { transform: translate(0,0) scale(1); }
  40%      { transform: translate(-22px,18px) scale(1.10); }
  75%      { transform: translate(16px,-12px) scale(0.93); }
}
@keyframes hiw-float-c {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(12px,22px) scale(1.06); }
}
@keyframes hiw-grid-drift {
  0%   { background-position: 0px 0px; }
  100% { background-position: 28px 28px; }
}
@keyframes hiw-shimmer-bar {
  0%,100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes hiw-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(139,92,246,0.50); }
  70%  { box-shadow: 0 0 0 7px rgba(139,92,246,0); }
  100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); }
}
@keyframes hiw-badge-text {
  0%,100% { opacity:0.75; }
  50%      { opacity:1; }
}
@keyframes hiw-connector-pulse {
  0%,100% { opacity:0.5; transform:translateX(0); }
  50%      { opacity:1; transform:translateX(2px); }
}
`;

const STEPS = [
  {
    num: 1,
    icon: Search,
    accentColor: 'var(--brand-violet)',
    lightBg: 'rgba(124,58,237,0.08)',
    iconBg: 'rgba(124,58,237,0.12)',
    iconColor: 'var(--brand-violet)',
    badgeBg: 'rgba(124,58,237,0.10)',
    borderColor: 'rgba(124,58,237,0.18)',
    hoverBorder: 'rgba(124,58,237,0.40)',
    hoverShadow: 'rgba(124,58,237,0.14)',
    title: 'ค้นหาโรงงาน',
    subtitle: 'ที่ตรงความต้องการ',
    desc: 'เลือกดูสินค้าตัวอย่าง วัตถุดิบ และโรงงานที่สนใจ ตามหมวดหมู่และงบประมาณ',
    action: 'ดูโรงงาน',
    href: '/factory-ideas',
  },
  {
    num: 2,
    icon: FileText,
    accentColor: '#EA6C00',
    lightBg: 'rgba(234,108,0,0.07)',
    iconBg: 'rgba(234,108,0,0.11)',
    iconColor: '#EA6C00',
    badgeBg: 'rgba(234,108,0,0.10)',
    borderColor: 'rgba(234,108,0,0.18)',
    hoverBorder: 'rgba(234,108,0,0.40)',
    hoverShadow: 'rgba(234,108,0,0.13)',
    title: 'ส่งคำขอราคา',
    subtitle: '(RFQ) ฟรี',
    desc: 'กรอก spec สินค้า จำนวน และงบประมาณ — โรงงานที่สนใจจะส่งใบเสนอราคาให้คุณเลือก',
    action: 'สร้าง RFQ',
    href: '/create-rfq',
  },
  {
    num: 3,
    icon: MessageCircle,
    accentColor: '#0D7F75',
    lightBg: 'rgba(13,127,117,0.07)',
    iconBg: 'rgba(13,127,117,0.11)',
    iconColor: '#0D7F75',
    badgeBg: 'rgba(13,127,117,0.10)',
    borderColor: 'rgba(13,127,117,0.18)',
    hoverBorder: 'rgba(13,127,117,0.40)',
    hoverShadow: 'rgba(13,127,117,0.13)',
    title: 'คุยรายละเอียด',
    subtitle: 'กับโรงงานโดยตรง',
    desc: 'Chat ตรงกับโรงงานที่สนใจ ปรับแบบ ตรวจสอบตัวอย่าง และเจรจาราคาได้อิสระ',
    action: 'ดูวิธีแชท',
    href: '/factory-ideas',
  },
  {
    num: 4,
    icon: CheckCircle,
    accentColor: '#16A34A',
    lightBg: 'rgba(22,163,74,0.07)',
    iconBg: 'rgba(22,163,74,0.11)',
    iconColor: '#16A34A',
    badgeBg: 'rgba(22,163,74,0.10)',
    borderColor: 'rgba(22,163,74,0.18)',
    hoverBorder: 'rgba(22,163,74,0.40)',
    hoverShadow: 'rgba(22,163,74,0.13)',
    title: 'ยืนยันและ',
    subtitle: 'รับสินค้า',
    desc: 'ยอมรับใบเสนอราคา วางเงินมัดจำผ่านระบบที่ปลอดภัย แล้วรอรับสินค้าคุณภาพตรงเวลา',
    action: 'ดูคำสั่งซื้อ',
    href: '/orders',
  },
] as const;

const TAB_ICONS: Record<HowToOrderTabId, typeof Rocket> = {
  steps: FileText,
  start: Rocket,
};

let styleInjected = false;

type HowToOrderSectionProps = {
  className?: string;
  variant?: 'mobile' | 'desktop';
};

export function HowToOrderSection({
  className = '',
  variant = 'mobile',
}: HowToOrderSectionProps) {
  const navigate = useNavigate();
  const media = HOW_TO_ORDER_MEDIA;
  const [activeTab, setActiveTab] = useState<HowToOrderTabId>(media.defaultTab);
  const isDesktop = variant === 'desktop';

  if (!media.enabled) return null;

  if (!styleInjected && typeof document !== 'undefined') {
    const tag = document.createElement('style');
    tag.textContent = ANIMATION_CSS;
    document.head.appendChild(tag);
    styleInjected = true;
  }

  const tourButtonStyle = {
    background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
    color: 'white',
    boxShadow: '0 4px 14px rgba(162,56,255,0.30)',
  };

  return (
    <>
      <section
        className={cn('relative overflow-hidden rounded-2xl', className)}
        style={{
          background:
            'linear-gradient(135deg, #FAF7FF 0%, #F3EDFF 50%, var(--surface-sun-wash) 100%)',
          boxShadow: '0 4px 32px rgba(124,58,237,0.08)',
        }}
      >
        <div
          className='absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none'
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.28) 0%, transparent 70%)',
            animation: 'hiw-float-a 10s ease-in-out infinite',
            filter: 'blur(36px)',
          }}
        />
        <div
          className='absolute -bottom-12 -left-10 w-56 h-56 rounded-full pointer-events-none'
          style={{
            background: 'radial-gradient(circle, rgba(253,186,116,0.28) 0%, transparent 70%)',
            animation: 'hiw-float-b 13s ease-in-out infinite',
            filter: 'blur(30px)',
          }}
        />
        <div
          className='absolute top-1/2 -translate-y-1/2 left-1/3 w-44 h-44 rounded-full pointer-events-none'
          style={{
            background: 'radial-gradient(circle, rgba(94,234,212,0.18) 0%, transparent 70%)',
            animation: 'hiw-float-c 16s ease-in-out infinite',
            filter: 'blur(32px)',
          }}
        />
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.09) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            animation: 'hiw-grid-drift 20s linear infinite',
          }}
        />
        <div
          className='absolute top-0 left-0 right-0 h-[3px] pointer-events-none rounded-t-2xl'
          style={{
            background:
              'linear-gradient(90deg, var(--brand-violet) 0%, #A855F7 35%, #EA6C00 65%, #16A34A 100%)',
            animation: 'hiw-shimmer-bar 4s ease-in-out infinite',
          }}
        />

        <div className='relative z-10 p-3.5 sm:p-5 lg:p-7'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 mb-4'>
            <div>
              <div className='flex items-center gap-2 mb-1.5'>
                <div
                  className='p-1.5 rounded-lg'
                  style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.22)',
                    animation: 'hiw-pulse-ring 2.8s ease-in-out infinite',
                  }}
                >
                  <Sparkles size={13} style={{ color: 'var(--brand-violet)' }} />
                </div>
                <span
                  className='text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase'
                  style={{
                    color: 'var(--brand-violet)',
                    animation: 'hiw-badge-text 3s ease-in-out infinite',
                  }}
                >
                  HOW IT WORKS
                </span>
              </div>
              <h2 className='text-brand-ink-deep text-lg sm:text-xl lg:text-2xl font-bold leading-tight'>
                สั่งผลิตสินค้ากับ Tryly
              </h2>
              {activeTab === 'steps' ? (
                <p className='mt-0.5 text-[12px] sm:text-sm text-brand-muted-purple'>
                  ง่ายแค่ 4 ขั้นตอน ไม่ต้องมีประสบการณ์มาก่อน
                </p>
              ) : null}
            </div>

            {activeTab === 'steps' ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => window.dispatchEvent(new CustomEvent('tryly-open-tour'))}
              className='hidden sm:flex shrink-0 items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 hover:opacity-90'
              style={tourButtonStyle}
            >
              <span>สาธิตการใช้งาน</span>
              <ArrowRight size={15} />
            </Button>
            ) : null}
          </div>

          {/* Pill tabs — hiw lavender theme */}
          <div
            className='mb-4 flex gap-1 rounded-xl p-1'
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(124,58,237,0.14)',
              boxShadow: '0 1px 8px rgba(124,58,237,0.06)',
            }}
            role='tablist'
            aria-label='วิธีใช้งาน Tryly'
          >
            {media.tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type='button'
                  role='tab'
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-200 sm:gap-1.5 sm:py-2.5 sm:text-[12px]',
                    isActive
                      ? 'bg-white text-[var(--brand-violet)] shadow-sm'
                      : 'text-brand-muted-purple hover:bg-white/40',
                  )}
                  style={
                    isActive
                      ? { border: '1px solid rgba(124,58,237,0.18)' }
                      : { border: '1px solid transparent' }
                  }
                >
                  <Icon size={13} />
                  <span className='truncate'>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'steps' ? (
            <div role='tabpanel'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4'>
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === STEPS.length - 1;
                return (
                  <div key={step.num} className='relative'>
                    {!isLast && (
                      <div
                        className='hidden lg:flex absolute top-7 -right-2.5 z-10 items-center justify-center w-5 h-5 rounded-full'
                        style={{
                          background: 'var(--neutral-white)',
                          border: '1px solid rgba(124,58,237,0.18)',
                          boxShadow: '0 1px 6px rgba(124,58,237,0.10)',
                          animation: 'hiw-connector-pulse 2s ease-in-out infinite',
                        }}
                      >
                        <ArrowRight size={10} style={{ color: '#A78BFA' }} />
                      </div>
                    )}

                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => navigate(step.href)}
                      className='w-full text-left rounded-xl p-2.5 sm:p-3.5 lg:p-4 transition-all duration-300 group active:scale-[0.97] relative'
                      style={{
                        background: 'var(--neutral-white)',
                        border: `1px solid ${step.borderColor}`,
                        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.border = `1px solid ${step.hoverBorder}`;
                        el.style.boxShadow = `0 8px 28px ${step.hoverShadow}, 0 1px 8px rgba(0,0,0,0.04)`;
                        el.style.transform = 'translateY(-2px) scale(1.015)';
                        el.style.background = `linear-gradient(135deg, var(--neutral-white) 60%, ${step.lightBg.replace('0.07', '0.12')})`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.border = `1px solid ${step.borderColor}`;
                        el.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)';
                        el.style.transform = 'none';
                        el.style.background = 'var(--neutral-white)';
                      }}
                    >
                      <div
                        className='absolute top-0 left-4 right-4 h-[2px] rounded-full pointer-events-none'
                        style={{
                          background: `linear-gradient(90deg, transparent, ${step.accentColor}70, transparent)`,
                        }}
                      />

                      <div className='relative z-10 flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3'>
                        <div
                          className='w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6'
                          style={{
                            background: step.iconBg,
                            border: `1px solid ${step.accentColor}30`,
                          }}
                        >
                          <Icon size={13} className='sm:hidden' style={{ color: step.iconColor }} />
                          <Icon
                            size={17}
                            className='hidden sm:block'
                            style={{ color: step.iconColor }}
                          />
                        </div>
                        <span
                          className='text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full'
                          style={{
                            background: step.badgeBg,
                            color: step.accentColor,
                            border: `1px solid ${step.accentColor}30`,
                          }}
                        >
                          <span className='sm:hidden'>#{step.num}</span>
                          <span className='hidden sm:inline'>ขั้นตอนที่ {step.num}</span>
                        </span>
                      </div>

                      <div className='relative z-10 mb-1 sm:mb-2'>
                        <p className='text-brand-ink-deep font-bold text-[12px] sm:text-[14px] lg:text-[15px] leading-snug'>
                          {step.title}
                        </p>
                        <p
                          className='font-semibold text-[11px] sm:text-[13px]'
                          style={{ color: step.accentColor }}
                        >
                          {step.subtitle}
                        </p>
                      </div>

                      <p className='relative z-10 hidden sm:block text-[11px] sm:text-[12px] leading-relaxed mb-2 sm:mb-3 text-gray-500'>
                        {step.desc}
                      </p>

                      <span
                        className='relative z-10 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all'
                        style={{ color: step.accentColor }}
                      >
                        {step.action}
                        <ArrowRight size={10} className='opacity-70' />
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button
              variant='unstyled'
              type='button'
              onClick={() => window.dispatchEvent(new CustomEvent('tryly-open-tour'))}
              className='sm:hidden mt-4 w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]'
              style={tourButtonStyle}
            >
              <span>สาธิตการใช้งาน</span>
              <ArrowRight size={15} />
            </Button>
            </div>
          ) : null}

          {activeTab === 'start' ? (
            <div
              role='tabpanel'
              className='rounded-xl p-4 sm:p-5'
              style={{
                background: 'var(--neutral-white)',
                border: '1px solid rgba(234,108,0,0.22)',
                boxShadow: '0 4px 20px rgba(234,108,0,0.08)',
              }}
            >
              <div className='flex items-start gap-3'>
                <div
                  className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full'
                  style={{
                    background: 'rgba(234,108,0,0.11)',
                    border: '1px solid rgba(234,108,0,0.25)',
                  }}
                >
                  <Rocket size={18} style={{ color: '#EA6C00' }} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-[14px] sm:text-[15px] font-bold text-brand-ink-deep'>
                    {media.start.title}
                  </p>
                  <p className='mt-1 text-[12px] sm:text-[13px] text-gray-500'>
                    {media.start.subtitle}
                  </p>
                </div>
              </div>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(media.start.href)}
                className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white transition-all active:scale-[0.98] hover:opacity-90'
                style={tourButtonStyle}
              >
                <Rocket size={15} />
                {media.start.cta}
                <ChevronRight size={15} />
              </Button>
            </div>
          ) : null}

          
        </div>
      </section>

    </>
  );
}
