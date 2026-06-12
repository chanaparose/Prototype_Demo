import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@lib/utils';
import { GlassFilter } from '@/components/ui/liquid-glass-surface';

const liquidButtonVariants = cva(
  "relative inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[transform,box-shadow,filter] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default: 'text-brand-navy-deep hover:scale-[1.02] active:scale-[0.98]',
        primary: 'text-white hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'text-gray-600 hover:scale-[1.02] active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs has-[>svg]:px-2.5',
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type LiquidButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof liquidButtonVariants> & {
    asChild?: boolean;
    tint?: string;
    filterId?: string;
  };

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  tint,
  filterId = 'liquid-button-glass',
  children,
  style,
  ...props
}: LiquidButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <>
      <Comp
        data-slot='button'
        className={cn(liquidButtonVariants({ variant, size, className }))}
        style={style}
        {...props}
      >
        <div
          aria-hidden
          className='absolute inset-0 rounded-[inherit] transition-all duration-300'
          style={{
            background:
              variant === 'primary' && tint
                ? `linear-gradient(135deg, color-mix(in srgb, ${tint} 88%, white) 0%, ${tint} 52%, color-mix(in srgb, ${tint} 78%, #4338ca) 100%)`
                : variant === 'ghost'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.86) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.88) 100%)',
            boxShadow:
              variant === 'primary' && tint
                ? [
                    `0 8px 22px color-mix(in srgb, ${tint} 38%, transparent)`,
                    'inset 0 1px 0 rgba(255,255,255,0.55)',
                    'inset 0 -1px 0 rgba(0,0,0,0.06)',
                  ].join(', ')
                : [
                    '0 4px 12px rgba(71,85,105,0.07)',
                    'inset 0 1px 0 rgba(255,255,255,0.95)',
                    'inset 0 -1px 0 rgba(255,255,255,0.35)',
                  ].join(', '),
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
          }}
        />
        <div
          aria-hidden
          className='absolute inset-0 -z-10 overflow-hidden rounded-[inherit]'
          style={{ backdropFilter: `url("#${filterId}")` }}
        />
        <span className='relative z-10 inline-flex items-center gap-1.5'>{children}</span>
      </Comp>
      <GlassFilter id={filterId} />
    </>
  );
}
