import React from 'react';
import { ChevronRight, Search, Star, ThumbsUp } from 'lucide-react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { formatThaiDate } from '@/components/features/factory-profile/utils';
import type { ReviewBrowseItem } from '@/components/features/reviews/reviewBrowseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
          <p className='inline-flex items-center gap-1 text-[13px] font-bold text-[var(--brand-navy)] md:text-sm'>
            <Star size={13} className='fill-amber-400 text-amber-400 md:hidden' strokeWidth={2.25} />
            <Star size={14} className='hidden fill-amber-400 text-amber-400 md:block' strokeWidth={2.25} />
            คะแนนสินค้า ({reviews.length})
          </p>
          {onViewAll ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={onViewAll}
              className='inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-brand-purple transition-colors hover:underline'
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
            className='w-full rounded-lg border border-gray-100 bg-slate-50/80 py-2 pl-8 pr-3 text-[12px] text-gray-500 placeholder:text-gray-400'
          />
        </div>

        <div className='space-y-2'>
          {reviews.length === 0 ? (
            <p className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 py-6 text-center text-[12px] text-gray-500'>
              ยังไม่มีรีวิว
            </p>
          ) : (
            reviews.slice(0, previewLimit).map((review) => (
              <div key={review.id} className='rounded-lg border border-gray-100 bg-slate-50/80 p-2.5'>
                <div className='mb-0.5 flex items-center justify-between gap-2'>
                  <p className='truncate text-xs font-medium text-gray-700'>{review.reviewer}</p>
                  <p className='inline-flex shrink-0 items-center gap-0.5 text-[10px] text-gray-500'>
                    <ThumbsUp size={10} strokeWidth={2.25} />
                    มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                  </p>
                </div>
                <p className='mb-0.5 text-[10px] font-semibold text-amber-600'>★ {review.rating}</p>
                {review.optionText ? (
                  <p className='mb-0.5 text-[10px] text-gray-500'>ตัวเลือกสินค้า: {review.optionText}</p>
                ) : null}
                <p className='text-[10px] leading-relaxed text-gray-600'>{review.comment}</p>
                {review.date ? (
                  <p className='mt-1 text-[9px] text-gray-400'>{formatThaiDate(review.date)}</p>
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
                    <p className='mb-0.5 text-[9px] font-semibold text-brand-purple'>
                      การตอบกลับจากโรงงาน
                    </p>
                    <p className='text-[10px] leading-relaxed text-gray-600'>{review.factoryReply}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {footerNote ? (
          <div className='mt-3 border-t border-gray-100 pt-2.5'>
            <p className='text-[10px] leading-relaxed text-gray-500'>{footerNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
