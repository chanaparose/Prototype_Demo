import React from 'react';
import { ChevronRight, Search, Star, ThumbsUp } from 'lucide-react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { formatThaiDate } from '@/components/features/factory-profile/utils';
import {
  REVIEW_BODY_TEXT_CLASS,
  REVIEW_HEADING_TEXT_CLASS,
  type ReviewBrowseItem,
} from '@/components/features/reviews/reviewBrowseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@lib/utils';

type ReviewPreviewSectionProps = {
  reviews: ReviewBrowseItem[];
  previewLimit?: number;
  onViewAll?: () => void;
  footerNote?: string;
  className?: string;
};

export function ReviewPreviewSection({
  reviews,
  previewLimit = 4,
  onViewAll,
  footerNote,
  className,
}: ReviewPreviewSectionProps) {
  return (
    <div className={className}>
      <div className='rounded-lg border border-gray-100 bg-white p-3 md:p-3.5'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <p
            className={cn(
              'inline-flex items-center gap-1 font-bold text-[var(--brand-navy)]',
              REVIEW_HEADING_TEXT_CLASS,
            )}
          >
            <Star size={14} className='fill-amber-400 text-amber-400' strokeWidth={2.25} />
            คะแนนสินค้า ({reviews.length})
          </p>
          {onViewAll ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={onViewAll}
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 font-medium text-brand-purple transition-colors hover:underline',
                REVIEW_BODY_TEXT_CLASS,
              )}
            >
              ดูทั้งหมด <ChevronRight size={13} strokeWidth={2.25} />
            </Button>
          ) : null}
        </div>

        <div className='relative mb-2.5'>
          <Search
            size={14}
            strokeWidth={2.25}
            className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400'
          />
          <Input
            type='text'
            disabled
            placeholder='ค้นหารีวิวจากผู้ซื้อคนอื่น'
            className={cn(
              'w-full rounded-lg border border-gray-100 bg-slate-50/80 py-2 pl-8 pr-3 text-gray-500 placeholder:text-gray-400',
              REVIEW_BODY_TEXT_CLASS,
            )}
          />
        </div>

        <div className='space-y-2'>
          {reviews.length === 0 ? (
            <p
              className={cn(
                'rounded-lg border border-dashed border-gray-100 bg-slate-50/80 py-6 text-center text-gray-500',
                REVIEW_BODY_TEXT_CLASS,
              )}
            >
              ยังไม่มีรีวิว
            </p>
          ) : (
            reviews.slice(0, previewLimit).map((review) => (
              <div key={review.id} className='rounded-lg border border-gray-100 bg-slate-50/80 p-2.5'>
                <div className='mb-0.5 flex items-center justify-between gap-2'>
                  <p className={cn('truncate font-medium text-gray-700', REVIEW_HEADING_TEXT_CLASS)}>
                    {review.reviewer}
                  </p>
                  <p
                    className={cn(
                      'inline-flex shrink-0 items-center gap-0.5 text-gray-500',
                      REVIEW_BODY_TEXT_CLASS,
                    )}
                  >
                    <ThumbsUp size={12} strokeWidth={2.25} />
                    มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                  </p>
                </div>
                <p className={cn('mb-0.5 font-semibold text-amber-600', REVIEW_BODY_TEXT_CLASS)}>
                  ★ {review.rating}
                </p>
                {review.optionText ? (
                  <p className={cn('mb-0.5 text-gray-500', REVIEW_BODY_TEXT_CLASS)}>
                    ตัวเลือกสินค้า: {review.optionText}
                  </p>
                ) : null}
                <p className={cn('leading-relaxed text-gray-600', REVIEW_BODY_TEXT_CLASS)}>
                  {review.comment}
                </p>
                {review.date ? (
                  <p className={cn('mt-1 text-gray-400', REVIEW_BODY_TEXT_CLASS)}>
                    {formatThaiDate(review.date)}
                  </p>
                ) : null}
                {review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className='mt-1.5'>
                    <ReviewImageAttachments
                      urls={review.imageUrls}
                      onPreviewUrl={(u) => openImageLightbox(u)}
                    />
                  </div>
                ) : null}
                {review.factoryReply ? (
                  <div className='mt-2 rounded-lg border border-brand-purple/15 bg-brand-purple/[0.04] px-2.5 py-2'>
                    <p className={cn('mb-0.5 text-brand-purple', REVIEW_HEADING_TEXT_CLASS)}>
                      การตอบกลับจากโรงงาน
                    </p>
                    <p className={cn('leading-relaxed text-gray-600', REVIEW_BODY_TEXT_CLASS)}>
                      {review.factoryReply}
                    </p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {footerNote ? (
          <div className='mt-3 border-t border-gray-100 pt-2.5'>
            <p className={cn('leading-relaxed text-gray-500', REVIEW_BODY_TEXT_CLASS)}>{footerNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
