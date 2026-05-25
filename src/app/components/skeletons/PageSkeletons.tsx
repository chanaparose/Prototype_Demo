/**
 * PageSkeletons.tsx
 * Reusable animate-pulse skeleton blocks for every page that fetches data.
 * Each component mirrors the exact shape of the real card/row it replaces.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// ─── 1. Horizontal product card (Explore "สินค้าแนะนำ" / "วัตถุดิบแนะนำ") ────
export function ProductCardSkeleton() {
  return (
    <div className='flex-shrink-0 w-[155px] rounded-lg overflow-hidden border border-gray-100 flex flex-col bg-white'>
      <Skeleton className='aspect-[4/3] w-full rounded-none' />
      <div className='p-2 space-y-1.5'>
        <Skeleton className='h-3 w-4/5' />
        <Skeleton className='h-2.5 w-3/5' />
        <div className='pt-1 flex items-center justify-between'>
          <Skeleton className='h-2.5 w-10' />
          <Skeleton className='h-2.5 w-12' />
        </div>
      </div>
    </div>
  );
}

// ─── 2. Grid card (FactoryIdeas สินค้า/วัตถุดิบ/ทั้งหมด grid mode) ────────────
export function ShowcaseGridCardSkeleton() {
  return (
    <div className='rounded-lg overflow-hidden border border-gray-100 flex flex-col bg-white'>
      <Skeleton className='aspect-[4/3] w-full rounded-none' />
      <div className='p-2 space-y-1.5'>
        <Skeleton className='h-3 w-4/5' />
        <Skeleton className='h-2.5 w-2/3' />
        <div className='pt-1 flex items-center justify-between'>
          <Skeleton className='h-2.5 w-10' />
          <Skeleton className='h-2.5 w-12' />
        </div>
      </div>
    </div>
  );
}

// ─── 3. List-mode showcase card (FactoryIdeas list mode) ─────────────────────
export function ShowcaseListItemSkeleton() {
  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3'>
      <Skeleton className='w-20 h-20 rounded-lg shrink-0' />
      <div className='flex-1 space-y-2 py-0.5'>
        <Skeleton className='h-3 w-1/3' />
        <Skeleton className='h-3.5 w-4/5' />
        <Skeleton className='h-3 w-3/5' />
        <div className='pt-1 flex items-center gap-3'>
          <Skeleton className='h-2.5 w-10' />
          <Skeleton className='h-2.5 w-14' />
        </div>
      </div>
    </div>
  );
}

// ─── 4. Idea article list item (FactoryIdeas idea tab) ───────────────────────
export function IdeaListItemSkeleton() {
  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-3'>
      <div className='flex items-center gap-2 mb-2'>
        <Skeleton className='h-5 w-12 rounded-full' />
        <Skeleton className='h-3 w-24' />
      </div>
      <Skeleton className='h-4 w-full mb-1.5' />
      <Skeleton className='h-4 w-4/5 mb-1.5' />
      <Skeleton className='h-3 w-full' />
      <Skeleton className='h-3 w-3/4 mt-1' />
      <div className='mt-2 pt-1.5 border-t border-gray-100'>
        <Skeleton className='h-3 w-20' />
      </div>
    </div>
  );
}

// ─── 5. Factory grid card (FactoryIdeas factory tab) ─────────────────────────
export function FactoryGridCardSkeleton() {
  return (
    <div className='rounded-lg overflow-hidden border border-gray-100 flex flex-col bg-white'>
      <Skeleton className='aspect-[4/3] w-full rounded-none' />
      <div className='p-2 space-y-1.5'>
        <Skeleton className='h-3 w-4/5' />
        <Skeleton className='h-2.5 w-3/5' />
        <div className='pt-1 flex items-center justify-between'>
          <Skeleton className='h-2.5 w-12' />
          <Skeleton className='h-2.5 w-10' />
        </div>
      </div>
    </div>
  );
}

// ─── 6. Factory list row (FactoriesList page) ─────────────────────────────────
export function FactoryListRowSkeleton() {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex'>
      <Skeleton className='w-28 shrink-0' style={{ minHeight: '96px' }} />
      <div className='flex-1 px-3 py-3 space-y-2'>
        <Skeleton className='h-3.5 w-3/5' />
        <Skeleton className='h-3 w-2/5' />
        <div className='pt-1 space-y-1'>
          <Skeleton className='h-3 w-4/5' />
          <Skeleton className='h-3 w-3/5' />
        </div>
      </div>
    </div>
  );
}

// ─── 7. Notification item (Notifications page) ───────────────────────────────
export function NotificationItemSkeleton() {
  return (
    <div className='bg-white p-3 rounded-2xl border border-slate-50 flex items-center gap-3'>
      <Skeleton className='w-12 h-12 rounded-2xl shrink-0' />
      <div className='flex-1 space-y-2'>
        <div className='flex justify-between gap-2'>
          <Skeleton className='h-3.5 w-2/5' />
          <Skeleton className='h-3 w-14 shrink-0' />
        </div>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-4/5' />
      </div>
      <Skeleton className='w-8 h-8 rounded-lg shrink-0' />
    </div>
  );
}

// ─── 8. Product detail full-page skeleton (ProductDetail / IdeaDetail) ───────
export function ProductDetailSkeleton() {
  return (
    <div className='min-h-screen bg-brand-panel pb-[72px]'>
      {/* hero image */}
      <Skeleton className='w-full aspect-[4/3] rounded-none' />

      {/* badge + title + price */}
      <div className='bg-white px-4 pt-4 pb-3 space-y-3'>
        <div className='flex gap-1.5'>
          <Skeleton className='h-5 w-16 rounded-sm' />
          <Skeleton className='h-5 w-12 rounded-sm' />
        </div>
        <Skeleton className='h-5 w-4/5' />
        <Skeleton className='h-8 w-2/5' />
        <div className='flex gap-4'>
          <Skeleton className='h-3 w-10' />
          <Skeleton className='h-3 w-14' />
        </div>
      </div>

      <div className='h-2 bg-brand-panel' />

      {/* specs */}
      <div className='bg-white px-4 py-3 space-y-3'>
        <Skeleton className='h-4 w-28' />
        {[...Array(4)].map((_, i) => (
          <div key={i} className='flex justify-between py-2 border-t border-gray-50'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>

      <div className='h-2 bg-brand-panel' />

      {/* description */}
      <div className='bg-white px-4 py-3 space-y-2'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-4/5' />
        <Skeleton className='h-3 w-3/5' />
      </div>

      <div className='h-2 bg-brand-panel' />

      {/* factory card */}
      <div className='bg-white px-4 py-3 flex items-center gap-3'>
        <Skeleton className='w-16 h-16 rounded-2xl shrink-0' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-3.5 w-2/5' />
          <Skeleton className='h-3 w-3/5' />
          <Skeleton className='h-3 w-1/3' />
        </div>
      </div>
    </div>
  );
}

// ─── 9. Messages conversation list skeleton ───────────────────────────────────
export function ConversationItemSkeleton() {
  return (
    <div className='flex items-center gap-3 px-4 py-3 bg-white/92 rounded-2xl border border-white/75'>
      <Skeleton className='w-12 h-12 rounded-2xl shrink-0' />
      <div className='flex-1 space-y-2'>
        <div className='flex justify-between gap-2'>
          <Skeleton className='h-3.5 w-2/5' />
          <Skeleton className='h-3 w-12 shrink-0' />
        </div>
        <Skeleton className='h-3 w-3/4' />
      </div>
    </div>
  );
}
