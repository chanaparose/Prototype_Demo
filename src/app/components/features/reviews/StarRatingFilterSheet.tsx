import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { computeBreakdown, REVIEW_BODY_TEXT_CLASS, type ReviewBrowseItem, type ReviewRatingBreakdown } from '@/components/features/reviews/reviewBrowseUtils';

type StarRatingFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** รายการรีวิวทั้งหมด — ใช้คำนวณจำนวนต่อดาว */
  reviews: ReviewBrowseItem[];
  pendingStar: number | null;
  onPendingStarChange: (star: number | null) => void;
  onConfirm: () => void;
  onViewAll: () => void;
};

export function StarRatingFilterSheet({
  open,
  onOpenChange,
  reviews,
  pendingStar,
  onPendingStarChange,
  onConfirm,
  onViewAll,
}: StarRatingFilterSheetProps) {
  if (!open) return null;

  const breakdown: ReviewRatingBreakdown = computeBreakdown(reviews);

  return (
    <div className='fixed inset-0 z-[80] flex flex-col justify-end'>
      <button
        type='button'
        aria-label='ปิดตัวกรองดาว'
        className='absolute inset-0 bg-black/40'
        onClick={() => onOpenChange(false)}
      />
      <div className='relative z-10 rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]'>
        <div className='mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200' />
        <div className='divide-y divide-gray-100'>
          {[5, 4, 3, 2, 1].map((star) => {
            const active = pendingStar === star;
            const count = breakdown[String(star) as keyof ReviewRatingBreakdown] ?? 0;
            return (
              <button
                key={star}
                type='button'
                onClick={() => onPendingStarChange(star)}
                className='flex w-full items-center gap-3 py-3.5 text-left'
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-brand-orange bg-brand-orange' : 'border-gray-300 bg-white',
                  )}
                >
                  {active ? <span className='h-1.5 w-1.5 rounded-full bg-white' /> : null}
                </span>
                <span className='flex min-w-0 flex-1 items-center gap-2'>
                  
                  <span className='flex items-center gap-0.5'>
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
                    ))}
                  </span>
                  <span className={cn('shrink-0 font-medium tabular-nums text-gray-600', REVIEW_BODY_TEXT_CLASS)}>
                    ({count})
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className='mt-3 grid grid-cols-2 gap-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => {
              onViewAll();
              onOpenChange(false);
            }}
            className={cn('rounded-lg border border-brand-orange py-3 font-semibold text-brand-orange', REVIEW_BODY_TEXT_CLASS)}
          >
            ดูทั้งหมด
          </Button>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn('rounded-lg bg-brand-orange py-3 font-semibold text-white', REVIEW_BODY_TEXT_CLASS)}
          >
            ตกลง
          </Button>
        </div>
      </div>
    </div>
  );
}
