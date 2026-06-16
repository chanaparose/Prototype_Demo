import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Search,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { StarRatingFilterSheet } from '@/components/features/reviews/StarRatingFilterSheet';
import { formatThaiDate } from '@/components/features/factory-profile/utils';
import {
  filterReviews,
  maskReviewer,
  type ReviewBrowseItem,
} from '@/components/features/reviews/reviewBrowseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ReviewsBrowseViewProps = {
  reviews: ReviewBrowseItem[];
  onBack: () => void;
  isDesktop?: boolean;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className='inline-flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
          )}
        />
      ))}
    </span>
  );
}

export function ReviewsBrowseView({
  reviews,
  onBack,
  isDesktop = false,
}: ReviewsBrowseViewProps) {
  const [filterAll, setFilterAll] = useState(true);
  const [withMedia, setWithMedia] = useState(false);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [pendingStar, setPendingStar] = useState<number | null>(null);
  const [starSheetOpen, setStarSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const mediaCount = useMemo(
    () => reviews.filter((r) => r.imageUrls && r.imageUrls.length > 0).length,
    [reviews],
  );

  const filteredReviews = useMemo(
    () =>
      filterReviews(reviews, {
        star: filterAll ? null : starFilter,
        withMedia,
        query,
      }),
    [reviews, filterAll, starFilter, withMedia, query],
  );

  const starLabel =
    filterAll || starFilter == null
      ? 'ดาว ทั้งหมด'
      : `${starFilter} ดาว`;

  const openStarSheet = () => {
    setPendingStar(starFilter);
    setStarSheetOpen(true);
  };

  const applyStarFilter = () => {
    if (pendingStar == null) {
      setFilterAll(true);
      setStarFilter(null);
      return;
    }
    setFilterAll(false);
    setStarFilter(pendingStar);
  };

  const resetStarFilter = () => {
    setFilterAll(true);
    setStarFilter(null);
    setPendingStar(null);
  };

  return (
    <div
      className={cn(
        'min-h-[100dvh] bg-white',
        isDesktop && 'mx-auto min-h-[calc(100vh-4rem)] max-w-3xl rounded-2xl border border-gray-100 shadow-sm',
      )}
    >
      <header className='sticky top-0 z-20 border-b border-gray-100 bg-white'>
        <div className='flex items-center gap-3 px-4 py-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={onBack}
            aria-label='กลับ'
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-gray-50'
          >
            <ArrowLeft className='h-5 w-5 text-gray-700' />
          </Button>
          <h1 className='flex-1 text-center text-base font-semibold text-gray-900'>คะแนน</h1>
          <div className='h-9 w-9 shrink-0' />
        </div>

        <div className='flex border-b border-gray-100'>
          <div className='relative flex-1 px-2 py-3 text-center text-sm font-semibold text-brand-orange'>
            คะแนนสินค้า
            <span className='absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-brand-orange' />
          </div>
        </div>

        <div className='flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide'>
          <button
            type='button'
            onClick={() => {
              setFilterAll(true);
              setStarFilter(null);
              setWithMedia(false);
            }}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium',
              filterAll && !withMedia
                ? 'border-brand-orange text-brand-orange'
                : 'border-gray-200 text-gray-600',
            )}
          >
            ทั้งหมด ({reviews.length})
          </button>
          <button
            type='button'
            onClick={() => {
              setWithMedia((v) => !v);
              setFilterAll(true);
              setStarFilter(null);
            }}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium',
              withMedia ? 'border-brand-orange text-brand-orange' : 'border-gray-200 text-gray-600',
            )}
          >
            มีรูปภาพ/วิดีโอ ({mediaCount})
          </button>
          <button
            type='button'
            onClick={openStarSheet}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium',
              !filterAll && starFilter != null
                ? 'border-brand-orange text-brand-orange'
                : 'border-gray-200 text-gray-600',
            )}
          >
            <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
            {starLabel}
            <ChevronDown className='h-3 w-3' />
          </button>
        </div>

        <div className='px-4 pb-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <Input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='ค้นหารีวิวจากผู้ซื้อคนอื่น'
              className='w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm'
            />
            <ImageIcon className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          </div>
        </div>
      </header>

      <div className='px-4 pb-8'>
        {filteredReviews.length === 0 ? (
          <p className='py-12 text-center text-sm text-gray-400'>ไม่พบรีวิวที่ตรงกับตัวกรอง</p>
        ) : (
          <ul className='divide-y divide-gray-100'>
            {filteredReviews.map((review) => (
              <li key={review.id} className='py-4'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500'>
                    {review.reviewer.trim().charAt(0).toUpperCase() || 'ล'}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      <p className='text-sm font-semibold text-gray-900'>
                        {maskReviewer(review.reviewer)}
                      </p>
                      <StarRow rating={Number(review.rating ?? 0)} />
                    </div>
                    {review.optionText ? (
                      <p className='mt-1 text-xs text-gray-500'>
                        ตัวเลือกสินค้า: {review.optionText}
                      </p>
                    ) : null}
                    <p className='mt-2 text-sm leading-relaxed text-gray-700'>{review.comment}</p>
                    {review.date ? (
                      <p className='mt-1 text-[11px] text-gray-400'>{formatThaiDate(review.date)}</p>
                    ) : null}
                    {review.imageUrls && review.imageUrls.length > 0 ? (
                      <div className='mt-3'>
                        <ReviewImageAttachments
                          urls={review.imageUrls}
                          onPreviewUrl={(u) => openImageLightbox(u)}
                        />
                      </div>
                    ) : null}
                    {review.factoryReply ? (
                      <div className='mt-3 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2'>
                        <p className='mb-0.5 text-[11px] font-semibold text-brand-purple'>
                          การตอบกลับจากโรงงาน
                        </p>
                        <p className='text-xs leading-relaxed text-slate-700'>{review.factoryReply}</p>
                      </div>
                    ) : null}
                    <p className='mt-2 inline-flex items-center gap-1 text-[11px] text-gray-400'>
                      <ThumbsUp className='h-3 w-3' />
                      มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StarRatingFilterSheet
        open={starSheetOpen}
        onOpenChange={setStarSheetOpen}
        reviews={reviews}
        pendingStar={pendingStar}
        onPendingStarChange={setPendingStar}
        onConfirm={applyStarFilter}
        onViewAll={resetStarFilter}
      />
    </div>
  );
}
