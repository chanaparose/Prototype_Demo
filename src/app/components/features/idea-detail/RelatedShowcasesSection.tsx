import React from 'react';
import type { FactoryShowcase } from '../../../contexts/DataContext';
import { partitionLinkedShowcases } from '../../../utils/linkedShowcases';
import { useRelatedShowcases } from '../../../hooks/useRelatedShowcases';

interface RelatedShowcasesSectionProps {
  linkedShowcases: unknown;
  onItemClick?: (item: FactoryShowcase) => void;
}

export function RelatedShowcasesSection({
  linkedShowcases,
  onItemClick,
}: RelatedShowcasesSectionProps) {
  const { showcaseIds } = React.useMemo(
    () => partitionLinkedShowcases(linkedShowcases),
    [linkedShowcases],
  );
  const { items, loading } = useRelatedShowcases(showcaseIds);

  if (!showcaseIds.length) return null;
  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <h2 className="text-[16px] font-bold mb-4" style={{ color: '#2E2252' }}>
        อ้างอิงในไอเดียนี้
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onItemClick?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onItemClick?.(item);
              }
            }}
            className="rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow cursor-pointer overflow-hidden"
          >
            <div className="aspect-[4/3] bg-gray-100">
              {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="p-2.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.contentType === 'promotion'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {item.contentType === 'promotion' ? 'โปรโมชัน' : 'สินค้า'}
              </span>
              <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 mt-1">{item.title}</p>
              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{item.factoryName}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export type { RelatedShowcasesSectionProps };
