import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SHOWCASE_DETAIL_BRAND as BRAND, daysBetween, formatShowcaseTHB as formatTHB, formatShowcaseThaiDate as formatThaiDate, normalizeShowcaseMarkdown as normalizeMarkdownContent } from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Star,
  Store,
  TicketPercent,
} from 'lucide-react';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { usePromotionDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useFactoryReviewSummary } from '@/hooks/useFactoryReviewSummary';
import { useFactoryReviewList } from '@/hooks/useFactoryReviewList';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

function promoMeta(startDate?: string, endDate?: string) {
  const now = new Date();
  const s = startDate ? new Date(startDate) : null;
  const e = endDate ? new Date(endDate) : null;
  const sOk = s && !Number.isNaN(s.getTime());
  const eOk = e && !Number.isNaN(e.getTime());

  if (!sOk || !eOk) return { status: 'โปรโมชัน', hint: 'กรุณาตรวจสอบวันเริ่มและวันสิ้นสุด' };
  if (now < s!)
    return {
      status: 'โปรใกล้เริ่ม',
      hint: `เริ่มในอีก ${daysBetween(now, s!)} วัน`,
    };
  if (now > e!)
    return {
      status: 'หมดโปรแล้ว',
      hint: `สิ้นสุดเมื่อ ${formatThaiDate(endDate!)}`,
    };
  return {
    status: 'กำลังจัดโปร',
    hint: `เหลืออีก ${daysBetween(now, e!)} วัน`,
  };
}

export function PromotionDetailDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const data = useData();
  const { item, loading, error, factory, resolvedId, relatedShowcases } =
    usePromotionDetailShowcase();
  const reviewSummaryQ = useFactoryReviewSummary(item?.factoryId ?? null);
  const reviewListQ = useFactoryReviewList(item?.factoryId ?? null);
  const { isLiked, toggleFavorite } = useFavorites();

  const gallery = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls)
      ? item.imageUrls.filter((u) => String(u).trim() !== '')
      : [];
    if (urls.length > 0) return urls.slice(0, 8);
    return item?.image ? [item.image] : [];
  }, [item?.image, item?.imageUrls]);
  const [activeImage, setActiveImage] = useState(0);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    setActiveImage(0);
  }, [item?.id]);

  if (loading) {
    return (
      <div
        className='hidden min-h-[calc(100vh-4rem)] items-center justify-center lg:flex'
        style={{ background: BRAND.purpleSoft }}
      >
        <span
          className='h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent'
          aria-hidden
        />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div
        className='hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)]'
        style={{ background: BRAND.purpleSoft }}
      >
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          aria-label='กลับไป'
          className='mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium'
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm'>
          <p className='text-[14px] text-gray-500 font-medium'>{error || 'ไม่พบข้อมูลโปรโมชัน'}</p>
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim() ?? null;
  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');
  const promo = promoMeta(item.startDate, item.endDate);
  const priceText = formatTHB(item.promoPrice ?? item.basePrice) ?? 'สอบถามราคา';
  const liked = item ? isLiked(item.id) : false;
  const likeCount = item ? item.likes + (liked ? 1 : 0) : 0;
  const summary = reviewSummaryQ.data;
  const avgRating = Number(summary?.average_rating ?? factory?.rating ?? 0);
  const reviewCount = Number(summary?.review_count ?? factory?.reviews ?? 0);
  const breakdown = summary?.rating_breakdown ?? {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0,
  };
  const latestReviews = reviewListQ.data ?? [];

  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PM',
      id: Number(resolvedId),
      title: item.title,
    });

  return (
    <div
      className='hidden lg:block min-h-[calc(100vh-4rem)]'
      style={{ background: 'var(--brand-panel)' }}
    >
      <div className='px-8 pt-5 pb-3'>
        <div className='flex items-center gap-1.5 text-[12px] text-gray-500'>
          <Button
            variant='unstyled'
            type='button'
            onClick={handleBack}
            className='inline-flex items-center gap-1 font-medium hover:opacity-80'
            style={{ color: BRAND.purple }}
          >
            <ArrowLeft className='w-3.5 h-3.5' /> กลับ
          </Button>
          <ChevronRight className='w-3 h-3 text-gray-300' />
          <span>{item.category || 'ทั้งหมด'}</span>
          {subName ? (
            <>
              <ChevronRight className='w-3 h-3 text-gray-300' />
              <span>{subName}</span>
            </>
          ) : null}
          <ChevronRight className='w-3 h-3 text-gray-300' />
          <span className='truncate max-w-[32rem]' style={{ color: BRAND.ink }}>
            {item.title}
          </span>
        </div>
      </div>

      <div className='px-8 pb-10 space-y-4'>
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <div className='flex gap-8'>
            <div className='w-[450px] shrink-0'>
              <div
                className='relative aspect-[4/3] rounded-xl overflow-hidden border'
                style={{ borderColor: BRAND.border, background: 'var(--neutral-warm-surface)' }}
              >
                <ImageWithFallback
                  src={gallery[activeImage] ?? item.image}
                  alt={item.title}
                  className='w-full h-full object-cover'
                />
                <span
                  className='absolute bottom-3 left-3 z-[2] inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md'
                  style={{ background: 'rgba(225,29,72,0.9)' }}
                >
                  <TicketPercent className='w-3 h-3' /> โปรโมชัน
                </span>
                {gallery.length > 1 ? (
                  <>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() =>
                        setActiveImage((p) => (p - 1 + gallery.length) % gallery.length)
                      }
                      className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center'
                    >
                      <ChevronLeft className='w-5 h-5' />
                    </Button>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => setActiveImage((p) => (p + 1) % gallery.length)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center'
                    >
                      <ChevronRight className='w-5 h-5' />
                    </Button>
                  </>
                ) : null}
              </div>
              {gallery.length > 1 ? (
                <div className='grid grid-cols-5 gap-2 mt-3'>
                  {gallery.slice(0, 5).map((url, idx) => (
                    <Button
                      variant='unstyled'
                      key={`${url}-${idx}`}
                      type='button'
                      onClick={() => setActiveImage(idx)}
                      className='aspect-square rounded-lg overflow-hidden border-2'
                      style={{
                        borderColor: idx === activeImage ? BRAND.rose : BRAND.border,
                      }}
                    >
                      <Image src={url} alt='' className='w-full h-full object-cover' />
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex flex-wrap items-center gap-2 mb-2'>
                {factory?.verified ? (
                  <span
                    className='inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold text-white'
                    style={{ background: BRAND.orange }}
                  >
                    <BadgeCheck className='w-3 h-3' /> Preferred
                  </span>
                ) : null}
              </div>

              <h1 className='text-[20px] leading-snug font-medium' style={{ color: BRAND.ink }}>
                {item.title}
              </h1>

              <div className='flex items-center gap-4 py-3 mt-1 border-b border-gray-100 text-[13px] text-gray-500'>
                <span className='inline-flex items-center gap-1'>
                  <span
                    className='border-b'
                    style={{ color: BRAND.orange, borderColor: BRAND.orange }}
                  >
                    {avgRating.toFixed(1)}
                  </span>
                  <Star className='w-3.5 h-3.5 fill-current' style={{ color: BRAND.orange }} />
                </span>
                <span>{reviewCount} รีวิว</span>
                <span>•</span>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void toggleFavorite(item.id)}
                  className='inline-flex items-center gap-1 active:opacity-70'
                >
                  <Heart
                    className='w-3.5 h-3.5'
                    style={
                      liked
                        ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                        : { color: BRAND.orange }
                    }
                  />
                  {likeCount} คนสนใจ
                </Button>
              </div>

              <div
                className='mt-4 px-4 py-3 rounded-xl border'
                style={{ background: 'var(--surface-paper-warm)', borderColor: '#F8DEC1' }}
              >
                <p
                  className='text-[22px] font-bold leading-none'
                  style={{ color: 'var(--brand-violet)' }}
                >
                  {priceText}
                </p>
                {item.basePrice != null &&
                item.promoPrice != null &&
                item.basePrice > item.promoPrice ? (
                  <p className='text-[12px] text-gray-400 line-through mt-1'>
                    {formatTHB(item.basePrice)}
                  </p>
                ) : null}
              </div>

              <div className='mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-bold text-rose-700'>ช่วงเวลาโปรโมชัน</p>
                  <span className='text-xs font-semibold text-rose-700'>{promo.status}</span>
                </div>
                <p className='text-xs text-rose-700 mt-1 inline-flex items-center gap-1'>
                  <CalendarClock className='w-3.5 h-3.5' /> {promo.hint}
                </p>
                <div className='grid grid-cols-2 gap-2 mt-2 text-xs'>
                  <div className='rounded-lg bg-white border border-rose-100 p-2'>
                    <p className='text-gray-500'>วันที่เริ่ม</p>
                    <p className='font-semibold text-gray-800'>
                      {item.startDate ? formatThaiDate(item.startDate) : '-'}
                    </p>
                  </div>
                  <div className='rounded-lg bg-white border border-rose-100 p-2'>
                    <p className='text-gray-500'>วันที่สิ้นสุด</p>
                    <p className='font-semibold text-gray-800'>
                      {item.endDate ? formatThaiDate(item.endDate) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-6 flex items-center gap-3'>
                {canChat ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={handleStartChat}
                    disabled={starting}
                    className='flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-semibold'
                    style={{
                      background: BRAND.orangeSoft,
                      color: BRAND.orange,
                      border: `1px solid ${BRAND.orange}`,
                    }}
                  >
                    <MessageCircle className='w-4 h-4' /> แชทกับโรงงาน
                  </Button>
                ) : null}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className='flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-bold text-white'
                  style={{ background: BRAND.orange }}
                >
                  <Store className='w-4 h-4' /> ดูโปรไฟล์โรงงาน
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
          <div className='flex items-center gap-5'>
            <div className='flex items-center gap-4 min-w-0'>
              <div className='w-fit shrink-0 rounded-2xl'>
                <div
                  className={`relative block h-17 w-17 overflow-hidden rounded-2xl border-2 shadow-md ring-1 ring-white ${
                    factory?.image ? 'border-white' : 'border-dashed border-indigo-200 bg-violet-50'
                  }`}
                >
                  {factory?.image ? (
                    <ImageWithFallback
                      src={factory.image}
                      alt={item.factoryName}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <span className='flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center'>
                      <ImageIcon size={20} className='text-indigo-400' strokeWidth={1.5} />
                      <span className='text-[9px] font-semibold leading-tight text-indigo-600'>
                        โปรไฟล์
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-[15px] font-semibold truncate' style={{ color: BRAND.ink }}>
                    {item.factoryName}
                  </p>
                  {factory?.verified ? (
                    <BadgeCheck className='w-4 h-4 shrink-0' style={{ color: BRAND.purple }} />
                  ) : null}
                </div>
                <p className='text-[12px] text-gray-500 truncate mt-0.5'>
                  {factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}
                </p>
                <p className='text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1'>
                  <MapPin className='w-3.5 h-3.5' /> {factory?.location || '-'}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-6 text-[13px] flex-1'>
              <div>
                <p className='text-gray-400 mb-1'>เรตติ้งเฉลี่ย</p>
                <p className='font-semibold' style={{ color: BRAND.orange }}>
                  {avgRating.toFixed(1)}
                </p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>รีวิวทั้งหมด</p>
                <p className='font-semibold' style={{ color: BRAND.orange }}>
                  {reviewCount}
                </p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>ออเดอร์ที่เสร็จแล้ว</p>
                <p className='font-semibold' style={{ color: BRAND.orange }}>
                  {factory?.completedOrders ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div
            className='px-6 py-3 border-b'
            style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}
          >
            <p className='text-[14px] font-bold' style={{ color: BRAND.ink }}>
              รายละเอียดสินค้า (Markdown)
            </p>
          </div>
          <div className='p-6'>
            {markdown ? (
              <>
                <MarkdownBody
                  source={markdown}
                  className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
                />
              </>
            ) : (
              <p className='text-[13px] text-gray-400'>ยังไม่มีรายละเอียดเพิ่มเติม</p>
            )}
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div
            className='px-6 py-3 border-b'
            style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}
          >
            <p className='text-[14px] font-bold' style={{ color: BRAND.ink }}>
              คะแนนรีวิว
            </p>
          </div>
          <div className='p-6'>
            <div className='flex items-center gap-8'>
              <div>
                <p className='text-[34px] leading-none font-bold' style={{ color: BRAND.orange }}>
                  {avgRating.toFixed(1)}
                </p>
                <p className='text-[12px] text-gray-500 mt-1'>จาก {reviewCount} รีวิว</p>
              </div>
              <div className='flex-1 space-y-2'>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(breakdown[String(star)] ?? 0);
                  const intensity =
                    reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                  return (
                    <div key={star} className='flex items-center gap-2'>
                      <span className='w-10 text-[12px] text-gray-500'>{star} ดาว</span>
                      <div className='h-2 flex-1 rounded-full bg-gray-100 overflow-hidden'>
                        <div
                          className='h-full rounded-full'
                          style={{
                            width: `${intensity}%`,
                            background: BRAND.orange,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className='mt-5 border-t border-gray-100 pt-4 space-y-3'>
              <p className='text-[13px] font-semibold' style={{ color: BRAND.ink }}>
                รีวิวล่าสุดจากลูกค้า
              </p>
              {latestReviews.length === 0 ? (
                <p className='text-[12px] text-gray-400'>ยังไม่มีรีวิว</p>
              ) : (
                latestReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className='rounded-lg border border-gray-100 px-3 py-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-[12px] font-semibold text-gray-700 truncate'>
                        {r.reviewer}
                      </p>
                      <p className='text-[11px] text-amber-600'>
                        ★ {Number(r.rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <p className='text-[12px] text-gray-600 mt-1 line-clamp-2'>
                      {r.comment || '-'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div
            className='px-6 py-3 border-b'
            style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}
          >
            <p className='text-[14px] font-bold' style={{ color: BRAND.ink }}>
              สินค้าที่ใกล้เคียง
            </p>
          </div>
          {relatedShowcases.length > 0 ? (
            <div className='p-6 grid grid-cols-4 gap-3'>
              {relatedShowcases.map((rp) => {
                const rf = data.factories.find((f) => f.id === rp.factoryId);
                const rating = Number(rf?.rating ?? rp.factoryRating ?? 0);
                const reviews = Number(rf?.reviews ?? 0);
                const isPromo = rp.contentType === 'promotion';
                return (
                  <Button
                    variant='unstyled'
                    key={rp.id}
                    type='button'
                    onClick={() =>
                      navigate(
                        `/${isPromo ? 'promotion-detail' : 'product-detail'}?showcase_id=${rp.id}`,
                      )
                    }
                    className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col w-full text-left'
                  >
                    <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={rp.image}
                        alt={rp.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                      <span
                        className='absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white'
                        style={{
                          backgroundColor: isPromo ? BRAND.orange : '#2563EB',
                        }}
                      >
                        {isPromo ? 'โปรโมชัน' : 'สินค้า'}
                      </span>
                    </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                      <div>
                        <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                          {rp.title}
                        </p>
                        <div className='flex items-center gap-0.5 mt-0.5'>
                          <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                          <span className='text-gray-500 text-[10px] truncate'>
                            {(rf?.provinceName ?? rf?.location ?? '').trim() || '—'}
                          </span>
                        </div>
                      </div>
                      <div className='mt-auto pt-1 border-t border-gray-50'>
                        <div className='flex items-center justify-between min-w-0'>
                          <div className='flex items-center gap-0.5 min-w-0'>
                            <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                            <span className='text-gray-700 text-[10px] font-semibold'>
                              {rating}
                            </span>
                            <span className='text-gray-400 text-[9px] truncate'>({reviews})</span>
                          </div>
                          <span className='text-gray-400 text-[8px] shrink-0'>
                            ขั้นต่ำ {rp.minOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className='p-8 text-center text-sm text-gray-400'>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
