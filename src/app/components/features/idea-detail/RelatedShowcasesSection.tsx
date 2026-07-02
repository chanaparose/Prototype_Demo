import React from 'react';
import { type FactoryShowcase } from '@/stores/types';
import { partitionLinkedShowcases } from '@/utils/linkedShowcases';
import { useRelatedShowcases } from '@/hooks/useRelatedShowcases';
import { Image } from '@/components/ui/image';
import { SHOWCASE_DETAIL_META_TEXT_CLASS } from '@/components/features/showcase-detail/showcaseDetailShared';
import { cn } from '@lib/utils';

interface RelatedShowcasesSectionProps {
  linkedShowcases: unknown;
  onItemClick?: (item: FactoryShowcase) => void;
  /** `inline` — ฝังในเนื้อหาบทความ (mobile), `card` — section แยก (desktop) */
  variant?: 'card' | 'inline';
  /** ซ่อนหัวข้อเมื่ออยู่ใน tab panel */
  embedded?: boolean;
}

export function RelatedShowcasesSection({
  linkedShowcases,
  onItemClick,
  variant = 'card',
  embedded = false,
}: RelatedShowcasesSectionProps) {
  const { showcaseIds } = React.useMemo(
    () => partitionLinkedShowcases(linkedShowcases),
    [linkedShowcases],
  );
  const { items, loading } = useRelatedShowcases(showcaseIds);

  if (!showcaseIds.length) return null;
  if (loading) return null;
  if (!items.length) return null;

  if (variant === 'inline') {
    return (
      <aside
        className={cn(!embedded && 'mt-5 border-t border-gray-100 pt-4')}
        aria-label='อ้างอิงในไอเดียนี้'
      >
        {!embedded ? (
          <h2 className={cn('mb-2 font-normal', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
            อ้างอิงในไอเดียนี้
          </h2>
        ) : null}
        <div className='-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory'>
          {items.map((item) => (
            <article
              key={item.id}
              role='button'
              tabIndex={0}
              onClick={() => onItemClick?.(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick?.(item);
                }
              }}
              className='w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60 active:scale-[0.98] transition-transform'
            >
              <div className='aspect-[4/3] bg-gray-100'>
                {item.image ? (
                  <Image src={item.image} alt={item.title} className='h-full w-full object-cover' />
                ) : null}
              </div>
              <div className='p-2'>
                <span
                  className={`inline-flex rounded-full px-1.5 py-px text-[9px] font-semibold ${
                    item.contentType === 'promotion'
                      ? 'bg-orange-100 text-orange-700'
                      : item.contentType === 'material'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {item.contentType === 'promotion'
                    ? 'โปรโมชัน'
                    : item.contentType === 'material'
                      ? 'วัตถุดิบ'
                      : 'สินค้า'}
                </span>
                <p className='mt-1 text-[12px] font-medium leading-snug text-gray-600 line-clamp-2'>
                  {item.title}
                </p>
              </div>
            </article>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <section className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6'>
      <h2 className='text-[16px] font-bold mb-4' style={{ color: 'var(--brand-navy)' }}>
        อ้างอิงในไอเดียนี้
      </h2>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        {items.map((item) => (
          <article
            key={item.id}
            role='button'
            tabIndex={0}
            onClick={() => onItemClick?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onItemClick?.(item);
              }
            }}
            className='rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow cursor-pointer overflow-hidden'
          >
            <div className='aspect-[4/3] bg-gray-100'>
              {item.image ? (
                <Image src={item.image} alt={item.title} className='w-full h-full object-cover' />
              ) : null}
            </div>
            <div className='p-2.5'>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.contentType === 'promotion'
                    ? 'bg-orange-100 text-orange-700'
                    : item.contentType === 'material'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-violet-100 text-violet-700'
                }`}
              >
                {item.contentType === 'promotion'
                  ? 'โปรโมชัน'
                  : item.contentType === 'material'
                    ? 'วัตถุดิบ'
                    : 'สินค้า'}
              </span>
              <p className='text-[12px] font-semibold text-gray-800 line-clamp-2 mt-1'>
                {item.title}
              </p>
              <p className='text-[11px] text-gray-500 line-clamp-1 mt-0.5'>{item.factoryName}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export type { RelatedShowcasesSectionProps };
