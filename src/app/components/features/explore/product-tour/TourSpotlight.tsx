import { tourAccent, TOUR_THEME } from '@/components/features/explore/product-tour/tourTheme';

export function SpotlightOverlay({
  rect,
  color,
  radius,
  pad = 10,
  transitioning,
  onClickOutside,
}: {
  rect: DOMRect | null;
  color: string;
  radius: number;
  pad?: number;
  transitioning: boolean;
  onClickOutside: () => void;
}) {
  const PAD = pad;
  const accent = tourAccent(color);
  const uniqueId = `tour-mask-${accent.replace(/[^a-zA-Z0-9]/g, '')}`;
  const glowId = `tour-glow-${uniqueId}`;

  return (
    <svg
      onClick={onClickOutside}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        pointerEvents: 'all',
        cursor: 'default',
        width: '100%',
        height: '100%',
        opacity: transitioning ? 0.72 : 1,
        transition: 'opacity 180ms ease',
      }}
    >
      <defs>
        <mask id={uniqueId}>
          <rect width='100%' height='100%' fill='white' />
          {rect && (
            <rect
              className='tour-spot'
              x={rect.left - PAD}
              y={rect.top - PAD}
              width={rect.width + PAD * 2}
              height={rect.height + PAD * 2}
              rx={radius}
              fill='black'
            />
          )}
        </mask>
        <filter id={glowId} x='-60%' y='-60%' width='220%' height='220%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='2.5' result='blur1' />
          <feGaussianBlur in='SourceGraphic' stdDeviation='7' result='blur2' />
          <feMerge>
            <feMergeNode in='blur2' />
            <feMergeNode in='blur1' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>

      {/* Balanced dim — content visible, focus clear */}
      <rect width='100%' height='100%' fill={TOUR_THEME.scrimBase} mask={`url(#${uniqueId})`} />

      {rect && (
        <>
          {/* No white fill — keeps true colors inside spotlight */}

          {/* Outer contrast ring */}
          <rect
            className='tour-spot'
            x={rect.left - PAD - 1}
            y={rect.top - PAD - 1}
            width={rect.width + PAD * 2 + 2}
            height={rect.height + PAD * 2 + 2}
            rx={radius + 1}
            fill='none'
            stroke={TOUR_THEME.ringContrast}
            strokeWidth='1.5'
            opacity='0.65'
          />

          {/* Accent glow */}
          <rect
            className='tour-spot'
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='none'
            stroke={accent}
            strokeWidth='4'
            opacity='0.55'
            filter={`url(#${glowId})`}
          />

          {/* Crisp accent ring */}
          <rect
            className='tour-ring tour-spot'
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='none'
            stroke={accent}
            strokeWidth='2.5'
            opacity='1'
          />
        </>
      )}
    </svg>
  );
}
