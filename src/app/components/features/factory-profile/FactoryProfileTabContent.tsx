import React, { useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
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
      className='bg-white rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-300 transition-all group flex flex-col active:scale-[0.98]'
    >
      <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
        />
        <span
          className='absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white'
          style={{ backgroundColor: badgeColor }}
        >
          {badgeLabel}
        </span>
      </div>
      <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
        <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
          {item.title}
        </p>
        <div className='flex items-center gap-0.5 mt-0.5'>
          <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
          <span className='text-gray-500 text-[10px] truncate'>{factory.location || '—'}</span>
        </div>
        <div className='mt-auto pt-1 border-t border-gray-50'>
          <div className='flex items-center justify-between min-w-0'>
            <div className='flex items-center gap-0.5 min-w-0'>
              <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
              <span className='text-gray-700 text-[10px] font-semibold'>{factory.rating}</span>
              <span className='text-gray-400 text-[9px] truncate'>({factory.reviews})</span>
            </div>
            <span className='text-gray-400 text-[8px] shrink-0'>ขั้นต่ำ {item.minOrder ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab bar — in-flow inside card (avoid sticky + negative margin overlap) */}
      <div className='border-b border-gray-100 bg-white'>
        <div className='flex overflow-x-auto scrollbar-hide'>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => onTabChange(tab.id)}
                className='relative flex-1 min-w-0 shrink-0 py-3 px-2 text-center'
              >
                <span
                  className={`text-[14px] leading-none whitespace-nowrap ${
                    active
                      ? 'font-bold text-[var(--brand-navy)]'
                      : 'font-medium text-gray-400'
                  }`}
                >
                  {tab.label}
                  {count > 0 ? (
                    <span
                      className={`ml-1 text-[12px] tabular-nums ${
                        active ? 'font-bold text-[var(--brand-navy)]' : 'font-medium text-gray-400'
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </span>
                {active && (
                  <span
                    className='absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full'
                    style={{ background: 'var(--brand-purple)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className='space-y-3 px-4 pb-6 pt-4 lg:px-6 lg:pb-8 lg:pt-5'>
      {activeTab === 'products' && (
        <div>
          {productItems.length === 0 ? (
            <div className='bg-white rounded-lg border border-gray-200 px-6 py-8 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีสินค้าแนะนำ
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-3'>
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
            <div className='bg-white rounded-lg border border-gray-200 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีวัตถุดิบ
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-3'>
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
            <div className='bg-white rounded-xl border border-slate-100 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีบทความ
            </div>
          ) : (
            <div className='space-y-3'>
              {articleShowcases.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onIdeaClick(item.id)}
                  className='bg-white rounded-xl overflow-hidden border border-slate-100 cursor-pointer hover:border-slate-200 transition-all group flex flex-col active:scale-[0.98] p-4 min-w-0'
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-bold text-brand-magenta'>
                      ไอเดีย
                    </span>
                    <p className='text-[10px] text-gray-400 truncate'>
                      {item.postedAt ? formatThaiDate(item.postedAt) : ''}
                    </p>
                  </div>
                  <p className='text-sm text-gray-900 line-clamp-2' style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className='text-xs text-gray-500 mt-1 line-clamp-3'>{item.excerpt}</p>
                  <div className='mt-3 pt-2 border-t border-gray-100'>
                    <p className='text-[10px] text-gray-400'>แตะเพื่ออ่านต่อ</p>
                  </div>
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
