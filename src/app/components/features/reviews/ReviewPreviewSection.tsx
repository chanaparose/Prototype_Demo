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
      <div className='rounded-lg border border-gray-200 bg-white p-4'>
        <div className='mb-2.5 flex items-center justify-between'>
          <p
            className='inline-flex items-center gap-1.5 text-sm text-gray-900'
            style={{ fontWeight: 700 }}
          >
            <Star className='h-4 w-4 fill-amber-400 text-amber-400' />
            คะแนนสินค้า ({reviews.length})
          </p>
          {onViewAll ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={onViewAll}
              className='inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-700'
            >
              ดูทั้งหมด <ChevronRight className='h-3 w-3' />
            </Button>
          ) : null}
        </div>

        <div className='relative mb-3'>
          <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400' />
          <Input
            type='text'
            disabled
            placeholder='ค้นหารีวิวจากผู้ซื้อคนอื่น'
            className='w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-500'
          />
        </div>

        <div className='space-y-2.5'>
          {reviews.length === 0 ? (
            <p className='text-sm text-gray-500'>ยังไม่มีรีวิว</p>
          ) : (
            reviews.slice(0, previewLimit).map((review) => (
              <div key={review.id} className='rounded-xl bg-gray-50 p-3'>
                <div className='mb-1 flex items-center justify-between'>
                  <p className='text-xs text-gray-700' style={{ fontWeight: 600 }}>
                    {review.reviewer}
                  </p>
                  <p className='inline-flex items-center gap-1 text-[11px] text-gray-500'>
                    <ThumbsUp className='h-3 w-3' />
                    มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                  </p>
                </div>
                <p className='mb-1 text-[11px] text-amber-600'>★ {review.rating}</p>
                {review.optionText ? (
                  <p className='mb-1 text-[11px] text-gray-500'>
                    ตัวเลือกสินค้า: {review.optionText}
                  </p>
                ) : null}
                <p className='text-xs text-gray-600'>{review.comment}</p>
                {review.date ? (
                  <p className='mt-1 text-[10px] text-gray-400'>{formatThaiDate(review.date)}</p>
                ) : null}
                {review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className='mt-2'>
                    <ReviewImageAttachments
                      urls={review.imageUrls}
                      onPreviewUrl={(u) => openImageLightbox(u)}
                    />
                  </div>
                ) : null}
                {review.factoryReply ? (
                  <div className='mt-2 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2'>
                    <p className='mb-0.5 text-[10px] font-semibold text-brand-purple'>
                      การตอบกลับจากโรงงาน
                    </p>
                    <p className='text-[11px] leading-relaxed text-slate-700'>{review.factoryReply}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {footerNote ? (
          <div className='mt-4 border-t border-gray-100 pt-4'>
            <p className='text-xs text-gray-500'>{footerNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
