import React, { useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ReviewPreviewSection } from '@/components/features/reviews/ReviewPreviewSection';
import { normalizeFactoryReview } from '@/components/features/reviews/reviewBrowseUtils';
import { formatThaiDate } from '@/components/features/factory-profile/utils';

export type TabId = 'products' | 'materials' | 'articles' | 'review';

import type { IFactoryProfileShowcase } from '@/domain/factory/types/factoryProfile.model';

export type { IFactoryProfileShowcase };

export type IdeaArticle = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  publishedAt: string;
};

export type FactoryAbout = {
  name: string;
  location: string;
  specialization: string;
  minOrder: number;
  leadTime: string;
  completedOrders: number;
  rating: number;
  reviews: number;
};

export type FactoryProfileExtra = {
  address?: string;
  description?: string;
  acceptedProductTypes?: string[];
  certificates?: string[];
};

export type ReviewItem = {
  id: string;
  reviewer: string;
  date: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  helpfulCount?: number;
  optionText?: string;
  factoryReply?: string;
  factoryReplyAt?: string;
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'products', label: 'สินค้า' },
  { id: 'materials', label: 'วัตถุดิบ' },
  { id: 'articles', label: 'บทความ' },
  { id: 'review', label: 'รีวิว' },
];

type FactoryProfileTabContentProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  productItems: IFactoryProfileShowcase[];
  materialItems: IFactoryProfileShowcase[];
  articleShowcases: IFactoryProfileShowcase[];
  factory: FactoryAbout;
  factoryId?: string;
  reviews: ReviewItem[];
  onProductClick: (id: string) => void;
  onIdeaClick: (id: string) => void;
  onViewAllReviews?: () => void;
};

export function FactoryProfileTabContent({
  activeTab,
  onTabChange,
  productItems,
  materialItems,
  articleShowcases,
  factory,
  factoryId,
  reviews,
  onProductClick,
  onIdeaClick,
  onViewAllReviews,
}: FactoryProfileTabContentProps) {
  const tabCounts = useMemo(
    () => ({
      products: productItems.length,
      materials: materialItems.length,
      articles: articleShowcases.length,
      review: reviews.length,
    }),
    [
      productItems.length,
      materialItems.length,
      articleShowcases.length,
      reviews.length,
    ],
  );

  const ShowcaseGridCard = ({
    item,
    onClick,
    badgeLabel,
    badgeColor,
  }: {
    item: IFactoryProfileShowcase;
    onClick: () => void;
    badgeLabel: string;
    badgeColor: string;
  }) => (
    <div
      onClick={onClick}
      className='group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-colors hover:border-brand-purple/25 active:scale-[0.98]'
    >
      <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
        />
        <span
          className='absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white'
          style={{ backgroundColor: badgeColor }}
        >
          {badgeLabel}
        </span>
      </div>
      <div className='flex flex-1 flex-col justify-between gap-0.5 p-2'>
        <p className='mb-0.5 truncate text-xs font-medium leading-tight text-gray-700 transition-colors group-hover:text-brand-purple'>
          {item.title}
        </p>
        <div className='mt-0.5 flex items-center gap-0.5'>
          <MapPin size={10} className='shrink-0 text-gray-400' strokeWidth={2.25} />
          <span className='truncate text-[10px] text-gray-500'>{factory.location || '—'}</span>
        </div>
        <div className='mt-auto border-t border-gray-50 pt-1'>
          <div className='flex min-w-0 items-center justify-between'>
            <div className='flex min-w-0 items-center gap-0.5'>
              <Star size={10} className='shrink-0 fill-amber-400 text-amber-400' />
              <span className='text-[10px] font-semibold text-gray-700'>{factory.rating}</span>
              <span className='truncate text-[9px] text-gray-400'>({factory.reviews})</span>
            </div>
            <span className='shrink-0 text-[9px] text-gray-400'>ขั้นต่ำ {item.minOrder ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div
        role='tablist'
        aria-label='เนื้อหาโปรไฟล์โรงงาน'
        className='flex overflow-x-auto border-b border-slate-200 scrollbar-hide'
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex h-9 min-w-0 flex-1 shrink-0 items-center justify-center px-2 transition-colors md:h-11',
                active ? 'text-brand-purple' : 'text-slate-500 hover:text-[var(--brand-navy)]',
              )}
            >
              <span
                className={cn(
                  'whitespace-nowrap text-[12px] font-bold leading-none md:text-sm',
                  !active && 'font-semibold',
                )}
              >
                {tab.label}
                {count > 0 ? (
                  <span className='ml-0.5 tabular-nums text-[10px] font-semibold md:text-xs'>
                    {count}
                  </span>
                ) : null}
              </span>
              {active ? (
                <span className='absolute bottom-[-1px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-purple md:w-10' />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className='space-y-2.5 px-3 pb-5 pt-3 lg:px-5 lg:pb-6 lg:pt-4'>
        {activeTab === 'products' && (
          <div>
            {productItems.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 px-4 py-8 text-center text-[12px] text-gray-500'>
                โรงงานนี้ยังไม่มีสินค้าแนะนำ
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-5 lg:gap-2.5'>
                {productItems.map((item) => (
                  <ShowcaseGridCard
                    key={item.id}
                    item={item}
                    onClick={() => onProductClick(item.id)}
                    badgeLabel='สินค้า'
                    badgeColor='var(--brand-orange)'
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div>
            {materialItems.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 px-4 py-8 text-center text-[12px] text-gray-500'>
                โรงงานนี้ยังไม่มีวัตถุดิบ
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-5 lg:gap-2.5'>
                {materialItems.map((item) => (
                  <ShowcaseGridCard
                    key={item.id}
                    item={item}
                    onClick={() => onProductClick(item.id)}
                    badgeLabel='วัตถุดิบ'
                    badgeColor='var(--status-success)'
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'articles' && (
          <div>
            {articleShowcases.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 px-4 py-8 text-center text-[12px] text-gray-500'>
                โรงงานนี้ยังไม่มีบทความ
              </div>
            ) : (
              <div className='space-y-2'>
                {articleShowcases.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onIdeaClick(item.id)}
                    className='group flex min-w-0 cursor-pointer flex-col rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:border-brand-purple/25 active:scale-[0.98]'
                  >
                    <div className='mb-1.5 flex items-center gap-2'>
                      <span className='inline-flex items-center rounded-full bg-brand-purple/10 px-2 py-0.5 text-[9px] font-semibold text-brand-purple'>
                        ไอเดีย
                      </span>
                      <p className='truncate text-[10px] text-gray-400'>
                        {item.postedAt ? formatThaiDate(item.postedAt) : ''}
                      </p>
                    </div>
                    <p className='line-clamp-2 text-xs font-semibold text-[var(--brand-navy)]'>
                      {item.title}
                    </p>
                    <p className='mt-1 line-clamp-3 text-[10px] leading-relaxed text-gray-500'>
                      {item.excerpt}
                    </p>
                    <p className='mt-2 border-t border-gray-100 pt-1.5 text-[9px] text-gray-400'>
                      แตะเพื่ออ่านต่อ
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <ReviewPreviewSection
            reviews={reviews.map(normalizeFactoryReview)}
            onViewAll={onViewAllReviews}
            footerNote={
              factoryId
                ? 'การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ'
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
