import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';

const mockStyles = {
  screen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } satisfies CSSProperties,
  scrollSurface: {
    flex: 1,
    overflowY: 'auto',
    background: 'var(--neutral-surface)',
  } satisfies CSSProperties,
  whiteCard: {
    background: 'var(--neutral-white)',
    borderRadius: 14,
    border: '1px solid var(--neutral-muted)',
  } satisfies CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--neutral-text)',
    display: 'block',
    marginBottom: 4,
  } satisfies CSSProperties,
  bottomBar: {
    flexShrink: 0,
    padding: '9px 12px',
    background: 'var(--neutral-white)',
    borderTop: '1px solid var(--neutral-muted)',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  } satisfies CSSProperties,
};

export function MockStatusBar() {
  return (
    <div className='flex shrink-0 items-center justify-between bg-white px-3.5 pb-0.5 pt-1'>
      <span className='text-[11px] font-bold text-[var(--neutral-text)]'>9:41</span>
      <span className='text-[9px] tracking-[2px] text-[var(--neutral-placeholder)]'>● ● ●</span>
      <span className='text-[10px] text-[var(--neutral-text)]'>🔋 100%</span>
    </div>
  );
}

export function MockNav({ title, showBack = true }: { title?: string; showBack?: boolean }) {
  return (
    <div className='flex shrink-0 items-center gap-2.5 border-b border-[var(--neutral-muted)] bg-white px-3.5 py-2'>
      {showBack ? (
        <div className='flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[var(--neutral-muted)] text-sm text-[var(--neutral-text)]'>
          ←
        </div>
      ) : null}
      {title ? (
        <span className='min-w-0 flex-1 truncate text-sm font-bold text-[var(--brand-ink)]'>
          {title}
        </span>
      ) : (
        <Image src='/assets/tryly-logo.png' alt='Tryly' className='h-[26px] object-contain' />
      )}
    </div>
  );
}

export function MockScreen({
  title,
  showBack,
  children,
}: {
  title?: string;
  showBack?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={mockStyles.screen}>
      <MockStatusBar />
      <MockNav title={title} showBack={showBack} />
      {children}
    </div>
  );
}

export function MockScroll({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={{ ...mockStyles.scrollSurface, ...style }}>{children}</div>;
}

export function MockPill({
  children,
  active,
  color,
}: {
  children: ReactNode;
  active?: boolean;
  color?: string;
}) {
  return (
    <span
      className='rounded-full px-3 py-1 text-[11px] font-semibold'
      style={{
        background: active ? color : 'var(--neutral-muted)',
        color: active ? 'var(--neutral-white)' : 'var(--neutral-text)',
        border: active ? 'none' : '1px solid var(--neutral-border)',
      }}
    >
      {children}
    </span>
  );
}

export function MockField({
  label,
  value,
  placeholder,
  filled = true,
  multiline,
  trailing,
}: {
  label: string;
  value?: ReactNode;
  placeholder?: ReactNode;
  filled?: boolean;
  multiline?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className='mb-3'>
      <Label style={mockStyles.label}>{label}</Label>
      <div
        className='rounded-[10px] px-3 py-[9px] text-xs leading-normal'
        style={{
          background: filled ? 'var(--neutral-white)' : 'var(--neutral-surface)',
          border: `1.5px solid ${filled ? '#E9D5FF' : 'var(--neutral-border)'}`,
          color: filled ? 'var(--neutral-black)' : 'var(--neutral-placeholder)',
          minHeight: multiline ? 56 : undefined,
          display: trailing ? 'flex' : undefined,
          justifyContent: trailing ? 'space-between' : undefined,
        }}
      >
        <span>{filled ? value : placeholder}</span>
        {trailing ? <span className='text-[var(--neutral-placeholder)]'>{trailing}</span> : null}
      </div>
    </div>
  );
}

export function TourGlowButton({
  children,
  color,
  glow = 'rgba(162,56,255,0.5)',
  glowSoft = 'rgba(162,56,255,0.3)',
  style,
}: {
  children: ReactNode;
  color: string;
  glow?: string;
  glowSoft?: string;
  style?: CSSProperties;
}) {
  return (
    <Button
      variant='unstyled'
      type='button'
      className='tour-btn-glow'
      style={
        {
          border: 'none',
          background: color,
          color: 'var(--neutral-white)',
          fontWeight: 700,
          cursor: 'default',
          '--tour-glow': glow,
          '--tour-glow-soft': glowSoft,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Button>
  );
}

export function MockBottomAction({
  icon,
  label,
}: {
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className='flex flex-col items-center gap-px px-2 text-[9px] text-[var(--neutral-subtle)]'>
      <span className='text-base'>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
