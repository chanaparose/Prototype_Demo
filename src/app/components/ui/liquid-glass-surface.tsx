import * as React from 'react';
import { cn } from '@lib/utils';

/** Shared outer shadow stack for frosted glass panels */
export const LIQUID_GLASS_PANEL_SHADOW = [
  '0 10px 40px rgba(46, 34, 82, 0.10)',
  '0 2px 10px rgba(46, 34, 82, 0.06)',
  'inset 0 1.5px 0 rgba(255, 255, 255, 0.92)',
  'inset 0 -1px 0 rgba(255, 255, 255, 0.45)',
  'inset 0 0 0 1px rgba(255, 255, 255, 0.35)',
].join(', ');

export const LIQUID_GLASS_SOFT_SHADOW = [
  '0 12px 32px rgba(71, 85, 105, 0.12)',
  '0 4px 14px rgba(71, 85, 105, 0.08)',
  'inset 0 1.5px 0 rgba(255, 255, 255, 0.88)',
  'inset 0 -1px 0 rgba(255, 255, 255, 0.36)',
  'inset 0 0 0 1px rgba(255, 255, 255, 0.30)',
].join(', ');

export function GlassFilter({ id = 'container-glass' }: { id?: string }) {
  return (
    <svg className='pointer-events-none absolute h-0 w-0 overflow-hidden' aria-hidden>
      <defs>
        <filter
          id={id}
          x='0%'
          y='0%'
          width='100%'
          height='100%'
          colorInterpolationFilters='sRGB'
        >
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.05 0.05'
            numOctaves='1'
            seed='1'
            result='turbulence'
          />
          <feGaussianBlur in='turbulence' stdDeviation='2' result='blurredNoise' />
          <feDisplacementMap
            in='SourceGraphic'
            in2='blurredNoise'
            scale='70'
            xChannelSelector='R'
            yChannelSelector='B'
            result='displaced'
          />
          <feGaussianBlur in='displaced' stdDeviation='4' result='finalBlur' />
          <feComposite in='finalBlur' in2='finalBlur' operator='over' />
        </filter>
      </defs>
    </svg>
  );
}

type LiquidGlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  filterId?: string;
  tone?: 'default' | 'bright' | 'tour' | 'soft-slate';
};

const TONE_STYLES = {
  default: {
    overlay: {
      background: 'rgba(255,255,255,0.62)',
      backdropFilter: 'blur(22px) saturate(180%)',
      WebkitBackdropFilter: 'blur(22px) saturate(180%)',
    },
    border: {
      borderColor: 'rgba(255,255,255,0.70)',
      boxShadow: LIQUID_GLASS_PANEL_SHADOW,
    },
  },
  bright: {
    overlay: {
      background:
        'linear-gradient(165deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 55%, rgba(248,250,255,0.86) 100%)',
      backdropFilter: 'blur(24px) saturate(190%)',
      WebkitBackdropFilter: 'blur(24px) saturate(190%)',
    },
    border: {
      borderColor: 'rgba(255,255,255,0.92)',
      boxShadow: [
        '0 16px 48px rgba(109, 40, 217, 0.08)',
        '0 4px 16px rgba(71, 85, 105, 0.06)',
        'inset 0 1.5px 0 rgba(255,255,255,0.98)',
        'inset 0 -1px 0 rgba(255,255,255,0.55)',
        'inset 0 0 0 1px rgba(255,255,255,0.45)',
      ].join(', '),
    },
  },
  tour: {
    overlay: {
      background: 'linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)',
    },
    border: {
      borderColor: 'rgba(255,255,255,1)',
      boxShadow: [
        '0 20px 56px rgba(21, 18, 40, 0.16)',
        '0 8px 24px rgba(109, 40, 217, 0.10)',
        'inset 0 1px 0 rgba(255,255,255,1)',
        'inset 0 0 0 1px rgba(237, 233, 254, 0.9)',
      ].join(', '),
    },
  },
  'soft-slate': {
    overlay: {
      background:
        'linear-gradient(180deg, rgba(22,18,42,0.91) 0%, rgba(15,12,32,0.94) 100%)',
      backdropFilter: 'blur(22px) saturate(165%)',
      WebkitBackdropFilter: 'blur(22px) saturate(165%)',
    },
    border: {
      borderColor: 'rgba(255,255,255,0.12)',
      boxShadow: LIQUID_GLASS_SOFT_SHADOW,
    },
  },
} as const;

export function LiquidGlassSurface({
  className,
  style,
  children,
  filterId = 'container-glass',
  tone = 'default',
  ...props
}: LiquidGlassSurfaceProps) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <>
      <div
        className={cn('relative isolate overflow-hidden', className)}
        style={style}
        {...props}
      >
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 rounded-[inherit]'
          style={toneStyle.overlay}
        />
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 rounded-[inherit] border'
          style={toneStyle.border}
        />
        {tone !== 'tour' ? (
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]'
            style={{ backdropFilter: `url("#${filterId}")` }}
          />
        ) : null}
        <div className='relative z-10'>{children}</div>
      </div>
      <GlassFilter id={filterId} />
    </>
  );
}
