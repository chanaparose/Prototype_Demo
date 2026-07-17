import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';

/**
 * ShowcaseCard — การ์ดสินค้า/วัตถุดิบ/โรงงาน (PD card) มาตรฐานเดียวทั้งแอป
 *
 * โครงสร้าง: รูป 4:3 (badge ซ้ายบน / heart ขวาบน / overlay อิสระ)
 * + ชื่อ + ที่ตั้ง (MapPin) + แถวล่าง (Star rating (+reviews) | ป้าย MOQ)
 *
 * ใช้ plain props เพื่อให้ทุก data shape (FactoryShowcase, IHubShowcaseItem,
 * factory row ฯลฯ) map เข้ามาได้ — แก้หน้าตา card ที่ไฟล์นี้ไฟล์เดียว
 * ปรับ layout ต่อหน้า (ความกว้าง ฯลฯ) ผ่าน className
 */

export type ShowcaseCardProps = {
  image: string;
  title: string;
  /** ที่ตั้ง/ชื่อโรงงาน ใต้ชื่อการ์ด — ค่าว่างจะแสดง '—' */
  location?: string;
  rating?: number | string;
  /** จำนวนรีวิว — แสดงเป็น "(n)" ต่อท้าย rating เมื่อระบุ */
  reviewsCount?: number | string;
  /** ป้ายมุมขวาล่าง format มาแล้ว เช่น "ขั้นต่ำ 100 ชิ้น" / "สอบถามขั้นต่ำ" */
  moqLabel: string;
  /** ป้ายมุมซ้ายบนแบบมาตรฐาน (pill สีทึบ ตัวอักษรขาว) */
  badge?: { label: string; color: string };
  /** ป้ายมุมซ้ายบนแบบ custom (เช่น pill "ยืนยัน" พื้นขาว) — ชนะ badge */
  badgeNode?: React.ReactNode;
  /** ปุ่มหัวใจมุมขวาบน */
  heart?: {
    showcaseId: string | number;
    isLiked: boolean;
    onToggle: (id: string | number) => void;
  };
  /** เนื้อหาเพิ่มเติมทับบนรูป (เช่น เลขอันดับ, gradient) */
  imageOverlay?: React.ReactNode;
  /** แสดงตัวอักษรแรกแทนเมื่อไม่มีรูป (เช่น Hub card) */
  imageFallbackChar?: string;
  onClick: () => void;
  className?: string;
};

export function ShowcaseCard({
  image,
  title,
  location,
  rating,
  reviewsCount,
  moqLabel,
  badge,
  badgeNode,
  heart,
  imageOverlay,
  imageFallbackChar,
  onClick,
  className,
}: ShowcaseCardProps) {
  return (
    <article
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all active:scale-[0.98] hover:border-brand-purple/20',
        className,
      )}
    >
      <div className='relative aspect-[4/3] shrink-0 overflow-hidden bg-gray-100'>
        {image ? (
          <ImageWithFallback
            src={image}
            alt={title}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-2xl font-bold text-brand-purple/30'>
            {(imageFallbackChar || title || 'T').slice(0, 1)}
          </div>
        )}

        {badgeNode ??
          (badge ? (
            <span
              className='absolute left-1 top-1 z-[1] rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white'
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </span>
          ) : null)}

        {heart ? (
          <ShowcaseHeartButton
            showcaseId={heart.showcaseId}
            isLiked={heart.isLiked}
            onToggle={heart.onToggle}
            className='absolute right-1 top-1 z-[1]'
          />
        ) : null}

        {imageOverlay}
      </div>

      <div className='flex min-w-0 flex-1 flex-col justify-between gap-0.5 p-2'>
        <div className='min-w-0'>
          <h3 className='mb-0.5 truncate text-xs font-medium leading-tight text-gray-700 transition-colors group-hover:text-brand-purple'>
            {title}
          </h3>
          <div className='mt-0.5 flex items-center gap-0.5'>
            <MapPin className='h-2.5 w-2.5 shrink-0 text-gray-400' />
            <span className='truncate text-[10px] text-gray-500'>
              {(location ?? '').trim() || '—'}
            </span>
          </div>
        </div>

        <div className='mt-auto border-t border-gray-50 pt-1'>
          <div className='flex min-w-0 items-center justify-between'>
            <div className='flex min-w-0 items-center gap-0.5'>
              <Star className='h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400' />
              <span className='text-[10px] font-semibold text-gray-700'>{rating ?? 0}</span>
              {reviewsCount != null ? (
                <span className='truncate text-[9px] text-gray-400'>({reviewsCount})</span>
              ) : null}
            </div>
            <span className='shrink-0 text-[9px] text-gray-400'>{moqLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** pill "ยืนยัน" พื้นขาวสำหรับการ์ดโรงงาน — ใช้ผ่าน badgeNode */
export function VerifiedBadgeNode({ icon }: { icon: React.ReactNode }) {
  return (
    <div className='absolute left-1 top-1 z-[1] flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 backdrop-blur-sm'>
      {icon}
      <span className='text-[8px] font-medium text-[var(--brand-purple)]'>ยืนยัน</span>
    </div>
  );
}
