import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ImageIcon,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { Button } from '@/components/ui/button';
import type { FactoryProfileExtra } from '@/components/features/factory-profile/FactoryProfileTabContent';

const NAVY = 'var(--brand-navy)';

export type FactoryHeroInfo = {
  id: string;
  name: string;
  image: string;
  /** แถบพื้นหลังด้านบน — ถ้าไม่มีจะใช้ gradient เหมือนหน้าแก้ไขโปรไฟล์โรงงาน */
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
  profile?: FactoryProfileExtra | null;
  factoryCategoryNames?: string[];
  factorySubCategoryNames?: string[];
  factorySubCategoryPairs?: { categoryLabel: string; subLabel: string }[];
  apiCertificates?: Record<string, unknown>[];
};

export function FactoryProfileHero({
  factory,
  onBack,
  onChat,
  chatLoading,
  showChat = true,
  profile,
  factoryCategoryNames = [],
  factorySubCategoryNames = [],
  factorySubCategoryPairs = [],
  apiCertificates = [],
}: FactoryProfileHeroProps) {
  const cover = String(factory.coverImageUrl ?? '').trim();
  const [showCategorySubs, setShowCategorySubs] = useState(false);

  const groupedCategorySubs = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of factorySubCategoryPairs) {
      const cat = String(p.categoryLabel ?? '').trim();
      const sub = String(p.subLabel ?? '').trim();
      if (!cat || !sub) continue;
      const prev = map.get(cat) ?? [];
      if (!prev.includes(sub)) prev.push(sub);
      map.set(cat, prev);
    }
    if (map.size === 0 && factoryCategoryNames.length > 0) {
      for (const c of factoryCategoryNames) map.set(c, []);
    }
    if (map.size === 0 && factorySubCategoryNames.length > 0) {
      map.set('หมวดย่อย', [...factorySubCategoryNames]);
    }
    return Array.from(map.entries());
  }, [factorySubCategoryPairs, factoryCategoryNames, factorySubCategoryNames]);

  const address = String(profile?.address ?? factory.location).trim();
  const profileCerts = profile?.certificates ?? [];
  const hasCerts = profileCerts.length > 0 || apiCertificates.length > 0;
  const hasDetails = Boolean(address) || groupedCategorySubs.length > 0 || hasCerts;

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
          <div className='flex w-fit shrink-0 items-end gap-2'>
            <div className='rounded-2xl'>
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
            {factory.verified ? (
              <StatusBadge variant='success' icon={<ShieldCheck size={12} />} className='mb-1'>
                ยืนยันแล้ว — พร้อมรับ RFQ
              </StatusBadge>
            ) : null}
          </div>

          <div className='min-w-0 flex-1 pt-1 sm:pb-0.5'>
            <div className='mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1'>
              <h1
                className='truncate text-lg font-bold leading-snug sm:text-xl'
                style={{ color: NAVY }}
              >
                {factory.name}
              </h1>
              <span className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-gray-500'>
                <Star className='h-3 w-3 shrink-0 fill-amber-300 text-amber-300' />
                {factory.rating} ({factory.reviews})
              </span>
              {factory.priceRange ? (
                <span className='shrink-0 whitespace-nowrap text-[11px] text-gray-500'>
                  {factory.priceRange}
                </span>
              ) : null}
            </div>

            {hasDetails ? (
              <div className='mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-600'>
                {address ? (
                  <p className='flex items-start gap-2'>
                    <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-purple-600' />
                    <span>
                      <span className='font-medium text-gray-700'>ที่อยู่: </span>
                      {address}
                    </span>
                  </p>
                ) : null}
                {groupedCategorySubs.length > 0 ? (
                  <div className='pt-0.5'>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => setShowCategorySubs((v) => !v)}
                      className='flex w-full max-w-xl items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 text-left'
                    >
                      <span className='text-[12px] font-semibold text-violet-800'>
                        หมวดหมู่ที่รับผลิต
                      </span>
                      <div className='inline-flex shrink-0 items-center gap-1.5 text-[11px] text-violet-700'>
                        <span>{groupedCategorySubs.length} หมวดหลัก</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${showCategorySubs ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </Button>
                    {showCategorySubs ? (
                      <div className='mt-2 max-h-80 space-y-1.5 overflow-auto rounded-xl border border-violet-100 bg-white p-2 shadow-sm'>
                        {groupedCategorySubs.map(([cat, subs]) => (
                          <div
                            key={`cat-group-${cat}`}
                            className='rounded-lg bg-violet-50/50 px-2.5 py-2'
                          >
                            <p className='text-[11px] font-bold text-violet-900'>{cat}</p>
                            <p className='mt-0.5 text-[11px] text-violet-700'>
                              {subs.length > 0 ? subs.join(', ') : 'ไม่มีหมวดย่อย'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className='flex items-start gap-2'>
                  <ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-purple-600' />
                  <div className='min-w-0'>
                    <p className='font-medium text-gray-700'>มาตรฐาน/ใบรับรอง</p>
                    <div className='mt-1 flex flex-wrap gap-1.5'>
                      {profileCerts.map((c) => (
                        <StatusBadge key={c} variant='active' size='sm'>
                          {c}
                        </StatusBadge>
                      ))}
                      {apiCertificates.map((c, i) => (
                        <StatusBadge
                          key={String(c.map_id ?? c.cert_id ?? c.id ?? i)}
                          variant='success'
                          size='sm'
                        >
                          {String(c.cert_name ?? c.name_th ?? c.cert_number ?? 'ใบรับรอง')}
                        </StatusBadge>
                      ))}
                      {!hasCerts ? <span className='text-gray-500'>-</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
