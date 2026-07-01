import { Link } from 'react-router';
import { CheckCircle, Factory, Sparkles } from 'lucide-react';
import type { OfferMetrics } from '@/components/features/rfq-detail/rfqOfferMetrics';

type CompareFactoryHeaderProps = {
  m: OfferMetrics;
  isSelected?: boolean;
};

/** Compact single-line factory column header */
export function CompareFactoryHeader({ m, isSelected }: CompareFactoryHeaderProps) {
  const recommended = m.offer.recommended;

  return (
    <Link
      to={`/factories/${m.offer.factoryId}`}
      className={`group flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-brand-purple/[0.06] ${
        isSelected && !recommended ? 'bg-brand-lavender-chip/40' : ''
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
          recommended
            ? 'border-brand-purple/30 bg-white text-brand-violet-deep'
            : 'border-brand-purple/12 bg-[var(--brand-page)] text-brand-mauve'
        }`}
      >
        <Factory size={14} />
      </span>
      <span className='min-w-0 flex-1 text-left'>
        <span className='block truncate text-[12px] font-semibold leading-tight text-brand-navy-ink group-hover:text-brand-violet-deep group-hover:underline'>
          {m.offer.factoryName}
        </span>
        <span className='mt-0.5 flex flex-wrap items-center gap-1'>
          {recommended ? (
            <span className='inline-flex items-center gap-0.5 rounded-full bg-brand-purple/15 px-1.5 py-px text-[9px] font-bold text-brand-violet-deep'>
              <Sparkles size={9} /> แนะนำ
            </span>
          ) : null}
          {m.offer.verified ? (
            <CheckCircle size={10} className='shrink-0 text-brand-mauve' aria-label='ยืนยันแล้ว' />
          ) : null}
        </span>
      </span>
    </Link>
  );
}
