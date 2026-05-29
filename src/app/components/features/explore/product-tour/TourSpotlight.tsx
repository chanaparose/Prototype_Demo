export function SpotlightOverlay({
  rect,
  color,
  radius,
  pad = 10,
  onClickOutside,
}: {
  rect: DOMRect | null;
  color: string;
  radius: number;
  pad?: number;
  onClickOutside: () => void;
}) {
  const PAD = pad;
  const uniqueId = `tour-mask-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
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
      }}
    >
      <defs>
        <mask id={uniqueId}>
          <rect width='100%' height='100%' fill='white' />
          {rect && (
            <rect
              x={rect.left - PAD}
              y={rect.top - PAD}
              width={rect.width + PAD * 2}
              height={rect.height + PAD * 2}
              rx={radius}
              fill='black'
            />
          )}
        </mask>
        {/* Glow filter — 3 layers of blur for a bright neon effect */}
        <filter id={glowId} x='-40%' y='-40%' width='180%' height='180%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='4' result='blur1' />
          <feGaussianBlur in='SourceGraphic' stdDeviation='10' result='blur2' />
          <feMerge>
            <feMergeNode in='blur2' />
            <feMergeNode in='blur1' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>

      {/* Dark overlay with cutout */}
      <rect width='100%' height='100%' fill='rgba(0,0,0,0.72)' mask={`url(#${uniqueId})`} />

      {rect && (
        <>
          {/* Bright fill inside the spotlight — lifts the content visually */}
          <rect
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='rgba(255,255,255,0.12)'
          />

          {/* Outer glow ring (blurred, wider) */}
          <rect
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='none'
            stroke={color}
            strokeWidth='6'
            opacity='0.5'
            filter={`url(#${glowId})`}
          />

          {/* Main ring — crisp, bright, pulsing */}
          <rect
            className='tour-ring'
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='none'
            stroke='white'
            strokeWidth='3.5'
            opacity='0.9'
          />

          {/* Colored ring on top — gives the neon tint */}
          <rect
            className='tour-ring'
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={radius}
            fill='none'
            stroke={color}
            strokeWidth='2.5'
            opacity='0.85'
          />
        </>
      )}
    </svg>
  );
}
