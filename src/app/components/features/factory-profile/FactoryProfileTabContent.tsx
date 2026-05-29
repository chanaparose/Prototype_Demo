import React, { useMemo } from 'react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ChevronRight, Search, ThumbsUp, MapPin, Star } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { formatThaiDate } from '@/components/features/factory-profile/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type TabId = 'products' | 'promotions' | 'materials' | 'articles' | 'review';

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
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'products', label: 'สินค้า' },
  { id: 'promotions', label: 'โปรโมชัน' },
  { id: 'materials', label: 'วัตถุดิบ' },
  { id: 'articles', label: 'บทความ' },
  { id: 'review', label: 'รีวิว' },
];

type FactoryProfileTabContentProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  productItems: IFactoryProfileShowcase[];
  promotionItems: IFactoryProfileShowcase[];
  materialItems: IFactoryProfileShowcase[];
  articleShowcases: IFactoryProfileShowcase[];
  factory: FactoryAbout;
  factoryId?: string;
  reviews: ReviewItem[];
  onProductClick: (id: string) => void;
  onPromotionClick: (id: string) => void;
  onIdeaClick: (id: string) => void;
};

export function FactoryProfileTabContent({
  activeTab,
  onTabChange,
  productItems,
  promotionItems,
  materialItems,
  articleShowcases,
  factory,
  factoryId,
  reviews,
  onProductClick,
  onPromotionClick,
  onIdeaClick,
}: FactoryProfileTabContentProps) {
  const tabCounts = useMemo(
    () => ({
      products: productItems.length,
      promotions: promotionItems.length,
      materials: materialItems.length,
      articles: articleShowcases.length,
      review: reviews.length,
    }),
    [
      productItems.length,
      promotionItems.length,
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
      className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]'
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
    <div className='space-y-3'>
      {/* ── Lezhin-style tab bar ── */}
      <div className='-mx-4 sticky top-14 z-20 bg-white border-b border-gray-200 lg:mx-0 lg:static lg:z-auto lg:border-b lg:border-gray-100'>
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

      <div className='px-0 lg:px-6 pt-1 space-y-3'>
      {activeTab === 'products' && (
        <div>
          {productItems.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีสินค้าแนะนำ
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
              {productItems.map((item) => (
                <ShowcaseGridCard
                  key={item.id}
                  item={item}
                  onClick={() => onProductClick(item.id)}
                  badgeLabel='สินค้า'
                  badgeColor='var(--brand-sky)'
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div>
          <div className='mb-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5'>
            <p className='text-[12px] font-semibold text-amber-800'>หมายเหตุโปรโมชัน</p>
            <p className='mt-0.5 text-[11px] text-amber-700'>
              ราคาและเงื่อนไขโปรโมชันอาจมีการเปลี่ยนแปลงตามช่วงเวลา กรุณาแชทสอบถามโรงงานก่อนสั่งซื้อทุกครั้ง
            </p>
          </div>
          {promotionItems.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีโปรโมชัน
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
              {promotionItems.map((item) => (
                <ShowcaseGridCard
                  key={item.id}
                  item={item}
                  onClick={() => onPromotionClick(item.id)}
                  badgeLabel='โปรโมชัน'
                  badgeColor='var(--brand-orange-deep)'
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          {materialItems.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีวัตถุดิบ
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
              {materialItems.map((item) => (
                <ShowcaseGridCard
                  key={item.id}
                  item={item}
                  onClick={() => onProductClick(item.id)}
                  badgeLabel='วัตถุดิบ'
                  badgeColor='var(--brand-teal-light)'
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <div>
          {articleShowcases.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center'>
              โรงงานนี้ยังไม่มีบทความ
            </div>
          ) : (
            <div className='space-y-3'>
              {articleShowcases.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onIdeaClick(item.id)}
                  className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98] p-4 min-w-0'
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <StatusBadge variant='info' size='sm'>
                      Idea
                    </StatusBadge>
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
        <div className='space-y-3'>
          <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <div className='flex items-center justify-between mb-2.5'>
              <p
                className='text-sm text-gray-900 inline-flex items-center gap-1.5'
                style={{ fontWeight: 700 }}
              >
                <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
                คะแนนสินค้า ({reviews.length})
              </p>
              <Button
                variant='unstyled'
                type='button'
                className='text-xs font-medium inline-flex items-center gap-0.5 text-gray-500 hover:text-gray-700'
              >
                ดูทั้งหมด <ChevronRight className='w-3 h-3' />
              </Button>
            </div>

            <div className='mb-3 relative'>
              <Search className='w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
              <Input
                type='text'
                disabled
                placeholder='ค้นหารีวิวจากผู้ซื้อคนอื่น'
                className='w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-500'
              />
            </div>

            <div className='space-y-2.5'>
              {reviews.length === 0 ? (
                <p className='text-sm text-gray-500'>ยังไม่มีรีวิว</p>
              ) : (
                reviews.slice(0, 4).map((review) => (
                  <div key={review.id} className='rounded-xl bg-gray-50 p-3'>
                    <div className='flex items-center justify-between mb-1'>
                      <p className='text-xs text-gray-700' style={{ fontWeight: 600 }}>
                        {review.reviewer}
                      </p>
                      <p className='text-[11px] text-gray-500 inline-flex items-center gap-1'>
                        <ThumbsUp className='w-3 h-3' />
                        มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                      </p>
                    </div>
                    <p className='text-[11px] text-amber-600 mb-1'>★ {review.rating}</p>
                    {review.optionText ? (
                      <p className='text-[11px] text-gray-500 mb-1'>
                        ตัวเลือกสินค้า: {review.optionText}
                      </p>
                    ) : null}
                    <p className='text-xs text-gray-600'>{review.comment}</p>
                    <p className='text-[10px] text-gray-400 mt-1'>{formatThaiDate(review.date)}</p>
                    {review.imageUrls && review.imageUrls.length > 0 ? (
                      <div className='mt-2'>
                        <ReviewImageAttachments
                          urls={review.imageUrls}
                          onPreviewUrl={(u) => openImageLightbox(u)}
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {factoryId && (
              <div className='mt-4 pt-4 border-t border-gray-100'>
                <p className='text-xs text-gray-500'>
                  การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น
                  เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
