export function SpotlightOverlay({
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
      </defs>
      <rect width='100%' height='100%' fill='rgba(0,0,0,0.70)' mask={`url(#${uniqueId})`} />
      {rect && (
        <rect
          className='tour-ring'
          x={rect.left - PAD}
          y={rect.top - PAD}
          width={rect.width + PAD * 2}
          height={rect.height + PAD * 2}
          rx={radius}
          fill='none'
          stroke={color}
          strokeWidth='3'
        />
      )}
    </svg>
  );
}
