import React from 'react';
import { ArrowLeft, ImageIcon, MapPin, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { Button } from '@/components/ui/button';

const NAVY = 'var(--brand-navy)';

export type FactoryHeroInfo = {
  id: string;
  name: string;
  image: string;
  coverImageUrl?: string;
  location: string;
  rating: number;
  reviews: number;
  priceRange: string;
  verified?: boolean;
};

type FactoryProfileHeroProps = {
  factory: FactoryHeroInfo;
  onBack: () => void;
  onChat: () => void;
  chatLoading?: boolean;
  showChat?: boolean;
};

export function FactoryProfileHero({
  factory,
  onBack,
  onChat,
  chatLoading,
  showChat = true,
}: FactoryProfileHeroProps) {
  const cover = String(factory.coverImageUrl ?? '').trim();

  return (
    <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
      <div
        className='relative h-28 sm:h-36'
        style={
          cover
            ? {
                backgroundImage: `url(${cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!cover ? (
          <div
            className='absolute inset-0 bg-gradient-to-br from-slate-100 via-violet-50 to-indigo-50'
            aria-hidden
          />
        ) : null}
        <div className='absolute inset-0 bg-slate-900/25 pointer-events-none' aria-hidden />

        <Button
          variant='unstyled'
          type='button'
          onClick={onBack}
          className='absolute left-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/95 shadow-sm backdrop-blur-[1px] hover:bg-white'
        >
          <ArrowLeft className='h-4 w-4 text-gray-700' />
        </Button>
        {showChat ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={onChat}
            disabled={chatLoading}
            className='absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/95 shadow-md backdrop-blur-[1px] hover:bg-white disabled:opacity-60'
            aria-label='แชทกับโรงงาน'
          >
            {chatLoading ? (
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-brand-royal border-t-transparent' />
            ) : (
              <MessageCircle className='h-5 w-5' style={{ color: 'var(--brand-royal)' }} />
            )}
          </Button>
        ) : null}
      </div>

      <div className='relative z-[2] px-5 pb-5 pt-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
          <div className='w-fit shrink-0 rounded-2xl'>
            <div
              className={`relative block h-24 w-24 overflow-hidden rounded-2xl border-2 shadow-md ring-4 ring-white sm:h-28 sm:w-28 ${
                factory.image ? 'border-white' : 'border-dashed border-indigo-200 bg-violet-50'
              }`}
            >
              {factory.image ? (
                <ImageWithFallback
                  src={factory.image}
                  alt=''
                  className='h-full w-full object-cover'
                />
              ) : (
                <span className='flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center'>
                  <ImageIcon size={28} className='text-indigo-400' strokeWidth={1.5} />
                  <span className='text-[10px] font-semibold leading-tight text-indigo-600'>
                    โปรไฟล์
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className='min-w-0 flex-1 pt-1 sm:pb-0.5'>
            <h1
              className='mt-0.5 truncate text-lg font-bold leading-snug sm:text-xl'
              style={{ color: NAVY }}
            >
              {factory.name}
            </h1>
            {factory.verified ? (
              <div className='mt-2 flex flex-wrap gap-2'>
                <StatusBadge variant='success' icon={<ShieldCheck size={12} />}>
                  ยืนยันแล้ว — พร้อมรับ RFQ
                </StatusBadge>
              </div>
            ) : null}
            <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500'>
              <span className='inline-flex items-center gap-1'>
                <MapPin className='h-3 w-3 shrink-0' />
                {factory.location}
              </span>
              <span className='inline-flex items-center gap-1'>
                <Star className='h-3 w-3 shrink-0 fill-amber-300 text-amber-300' />
                {factory.rating} ({factory.reviews})
              </span>
              {factory.priceRange ? <span>{factory.priceRange}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
