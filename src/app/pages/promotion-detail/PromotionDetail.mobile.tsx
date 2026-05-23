import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SHOWCASE_DETAIL_BRAND as BRAND, daysBetween, formatShowcaseTHB as formatTHB, formatShowcaseThaiDate as formatThaiDate, normalizeShowcaseMarkdown as normalizeMarkdownContent } from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight as Chevron,
  CalendarClock,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Share2,
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
import { getCurrentHref } from '@/utils/navigation/redirect';
import { useFactoryReviewList } from '@/hooks/useFactoryReviewList';
import { useFavorites } from '@/hooks/useFavorites';
import { type FactoryShowcase } from '@/stores/types';
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

export function PromotionDetailMobile() {
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
      <div className='flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8'>
        <span
          className='h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent'
          aria-hidden
        />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className='px-4 pt-5 pb-20'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          aria-label='กลับไป'
          className='mb-4 inline-flex items-center gap-1 text-sm'
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm'>
          {error ?? 'ไม่พบข้อมูลโปรโมชัน'}
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');
  const promo = promoMeta(item.startDate, item.endDate);
  const priceText =
    formatTHB(item.promoPrice ?? item.basePrice) ?? (item.priceRange?.trim() || null);
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
  const subName = item.sub_category_name?.trim() ?? null;

  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PM',
      id: Number(resolvedId),
      title: item.title,
    });

  const specRows: { label: string; value: string }[] = [];
  specRows.push({
    label: 'สถานะโปรโมชัน',
    value: `${promo.status} · ${promo.hint}`,
  });
  specRows.push({
    label: 'วันที่เริ่ม',
    value: item.startDate ? formatThaiDate(item.startDate) : '-',
  });
  specRows.push({
    label: 'วันที่สิ้นสุด',
    value: item.endDate ? formatThaiDate(item.endDate) : '-',
  });
  if (item.category) specRows.push({ label: 'หมวดหมู่', value: item.category });
  if (subName) specRows.push({ label: 'ประเภทย่อย', value: subName });
  specRows.push({ label: 'ขั้นต่ำผลิต (MOQ)', value: `${item.minOrder} ชิ้น` });
  if (item.leadTime) specRows.push({ label: 'ระยะเวลาผลิต', value: item.leadTime });
  if (factory?.location) specRows.push({ label: 'สถานที่ผลิต', value: factory.location });
  if (Array.isArray(item.specs) && item.specs.length > 0) {
    const sorted = [...item.specs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const s of sorted) {
      const label = String(s.spec_key ?? '').trim();
      const value = String(s.spec_value ?? '').trim();
      if (label && value) specRows.push({ label, value });
    }
  }

  return (
    <div className='min-h-screen bg-brand-panel pb-[72px]'>
      <div className='relative w-full aspect-[4/3] bg-white overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='relative h-full max-h-full max-w-full aspect-square'>
            <ImageWithFallback
              src={gallery[activeImage] ?? item.image}
              alt={item.title}
              className='absolute inset-0 h-full w-full object-cover'
            />
          </div>
        </div>

        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='absolute top-3 left-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center'
          aria-label='กลับ'
        >
          <ArrowLeft className='w-5 h-5 text-white' />
        </Button>
        <Button
          variant='unstyled'
          type='button'
          className='absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center'
          aria-label='แชร์'
          onClick={() => {
            const url = getCurrentHref();
            if (typeof navigator !== 'undefined' && navigator.share) {
              void navigator.share({
                title: item.title,
                url,
              });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              void navigator.clipboard.writeText(url);
            }
          }}
        >
          <Share2 className='w-5 h-5 text-white' />
        </Button>

        {gallery.length > 1 ? (
          <span className='absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums'>
            {activeImage + 1} / {gallery.length}
          </span>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className='bg-white px-3 py-2 border-b' style={{ borderColor: BRAND.divider }}>
          <div className='flex gap-2 overflow-x-auto'>
            {gallery.map((url, idx) => {
              const active = idx === activeImage;
              return (
                <Button
                  variant='unstyled'
                  key={`${url}-${idx}`}
                  type='button'
                  onClick={() => setActiveImage(idx)}
                  className='shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors'
                  style={{ borderColor: active ? BRAND.rose : BRAND.border }}
                >
                  <Image src={url} alt='' className='w-full h-full object-cover' />
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className='bg-white px-4 pt-4 pb-3'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {factory?.verified ? (
            <span
              className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-white'
              style={{ background: BRAND.orange }}
            >
              <BadgeCheck className='w-2.5 h-2.5' /> Preferred
            </span>
          ) : null}
          <span
            className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-semibold text-white'
            style={{ background: BRAND.rose }}
          >
            <TicketPercent className='w-2.5 h-2.5' />
            โปรโมชัน
          </span>
          <span
            className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-semibold'
            style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
          >
            <CalendarClock className='w-2.5 h-2.5 shrink-0' />
            {promo.status}
          </span>
          {item.category ? (
            <span className='text-[10px] text-gray-500'>{item.category}</span>
          ) : null}
        </div>

        <h1 className='mt-2 text-[15px] font-medium leading-snug' style={{ color: BRAND.ink }}>
          {item.title}
        </h1>

        <div className='flex items-baseline gap-2 flex-wrap mt-2'>
          {priceText ? (
            <p
              className='text-[24px] font-bold leading-none'
              style={{ color: 'var(--brand-violet)' }}
            >
              {priceText}
            </p>
          ) : (
            <p
              className='text-[18px] font-semibold leading-none'
              style={{ color: 'var(--brand-violet)' }}
            >
              สอบถามราคากับโรงงาน
            </p>
          )}
          {item.basePrice != null && item.promoPrice != null && item.promoPrice < item.basePrice ? (
            <p className='text-[13px] line-through text-gray-400'>{formatTHB(item.basePrice)}</p>
          ) : null}
        </div>

        <div className='flex items-center gap-3 mt-2 text-[11px] text-gray-500'>
          <span className='inline-flex items-center gap-1'>
            <span className='border-b' style={{ color: BRAND.orange, borderColor: BRAND.orange }}>
              {avgRating.toFixed(1)}
            </span>
            <Star className='w-3 h-3 fill-current' style={{ color: BRAND.orange }} />
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
              className='w-3 h-3'
              style={
                liked
                  ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                  : { color: BRAND.orange }
              }
            />
            <span className='text-[11px]'>{likeCount}</span>
            <span className='text-[11px]'>สนใจ</span>
          </Button>
        </div>
      </div>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      {item.tags.length > 0 ? (
        <>
          <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
          <div className='bg-white px-4 py-3'>
            <p className='text-[12px] font-semibold mb-2' style={{ color: BRAND.ink }}>
              แท็กสินค้า
            </p>
            <div className='flex flex-wrap gap-1.5'>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-medium'
                  style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      <div className='bg-white px-4 py-3'>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-[13px] font-bold' style={{ color: BRAND.ink }}>
            ข้อมูลจำเพาะของสินค้า
          </p>
        </div>
        <div className='divide-y' style={{ borderColor: BRAND.divider }}>
          {specRows.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className='flex items-start justify-between py-2 gap-3'
              style={idx > 0 ? { borderTop: `1px solid ${BRAND.divider}` } : undefined}
            >
              <span className='text-[12px] text-gray-500 w-32 shrink-0'>{row.label}</span>
              <span className='text-[12px] text-right flex-1' style={{ color: BRAND.ink }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-white px-4 py-3'>
        <p className='text-[13px] font-bold mb-2' style={{ color: BRAND.ink }}>
          รายละเอียดสินค้า
        </p>
        {markdown ? (
          <MarkdownBody
            source={markdown}
            className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
          />
        ) : (
          <p className='text-[12px] text-gray-400'>ยังไม่มีรายละเอียดเพิ่มเติม</p>
        )}
      </div>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      <Button
        variant='unstyled'
        type='button'
        onClick={() => navigate(`/factories/${item.factoryId}`)}
        className='block w-full text-left bg-white px-2 py-2 active:opacity-90'
      >
        <div className='flex items-center gap-3'>
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
                  <ImageIcon size={22} className='text-indigo-400' strokeWidth={1.5} />
                  <span className='text-[9px] font-semibold leading-tight text-indigo-600'>
                    โปรไฟล์
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-1'>
              <p className='text-[13px] font-semibold truncate' style={{ color: BRAND.ink }}>
                {item.factoryName}
              </p>
              {factory?.verified ? (
                <BadgeCheck className='w-3.5 h-3.5 shrink-0' style={{ color: BRAND.purple }} />
              ) : null}
            </div>
            <p className='text-[11px] text-gray-500 truncate mt-0.5'>
              {factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}
            </p>
            <div className='flex items-center gap-3 mt-1 text-[10px] text-gray-500'>
              <span className='inline-flex items-center gap-0.5'>
                <Star className='w-3 h-3 fill-amber-400' style={{ color: BRAND.orange }} />
                <span className='font-semibold' style={{ color: BRAND.ink }}>
                  {avgRating.toFixed(1)}
                </span>
              </span>
              {factory?.location ? (
                <span className='inline-flex items-center gap-0.5 truncate'>
                  <MapPin className='w-3 h-3' /> {factory.location}
                </span>
              ) : null}
            </div>
          </div>
          <Chevron className='w-4 h-4 text-gray-300 shrink-0' />
        </div>
      </Button>

      <div className='bg-white px-4 py-3'>
        <p className='text-[13px] font-bold mb-2' style={{ color: BRAND.ink }}>
          คะแนนรีวิว
        </p>
        <div className='flex items-center gap-4'>
          <div>
            <p className='text-[28px] leading-none font-bold' style={{ color: BRAND.orange }}>
              {avgRating.toFixed(1)}
            </p>
            <p className='text-[11px] text-gray-500 mt-1'>{reviewCount} รีวิว</p>
          </div>
          <div className='flex-1 space-y-1.5'>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(breakdown[String(star)] ?? 0);
              const intensity =
                reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
              return (
                <div key={star} className='flex items-center gap-2'>
                  <span className='w-8 text-[10px] text-gray-500'>{star}★</span>
                  <div className='h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden'>
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
        <div className='mt-4 pt-3 border-t border-gray-100 space-y-2'>
          <p className='text-[12px] font-semibold' style={{ color: BRAND.ink }}>
            รีวิวล่าสุดจากลูกค้า
          </p>
          {latestReviews.length === 0 ? (
            <p className='text-[11px] text-gray-400'>ยังไม่มีรีวิว</p>
          ) : (
            latestReviews.slice(0, 2).map((r) => (
              <div key={r.id} className='rounded-lg border border-gray-100 px-2.5 py-2'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-[11px] font-semibold text-gray-700 truncate'>{r.reviewer}</p>
                  <p className='text-[10px] text-amber-600'>★ {Number(r.rating || 0).toFixed(1)}</p>
                </div>
                <p className='text-[11px] text-gray-600 mt-1 line-clamp-2'>{r.comment || '-'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <>
        <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
        <div className='bg-white px-4 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-[13px] font-bold' style={{ color: BRAND.ink }}>
              สินค้าที่ใกล้เคียง
            </p>
          </div>
          {relatedShowcases.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
              {relatedShowcases.map((rp: FactoryShowcase) => {
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
                    className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col h-full w-full text-left active:scale-[0.98]'
                  >
                    <div className='relative aspect-[4/3] overflow-hidden bg-gray-100 shrink-0'>
                      <ImageWithFallback
                        src={rp.image}
                        alt={rp.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      />
                      <span
                        className='absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white'
                        style={{
                          backgroundColor: isPromo ? BRAND.orange : '#2563EB',
                        }}
                      >
                        {isPromo ? 'โปรโมชัน' : 'สินค้า'}
                      </span>
                    </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5 min-w-0'>
                      <div>
                        <h3 className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                          {rp.title}
                        </h3>
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
            <p className='text-center text-xs text-gray-400 py-4'>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </p>
          )}
        </div>
      </>

      <div
        className='fixed inset-x-2 bottom-2 bg-white/92 backdrop-blur-md border z-40 flex items-stretch h-[58px] rounded-2xl shadow-[0_12px_30px_rgba(46,34,82,0.16)] overflow-hidden supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]'
        style={{ borderColor: BRAND.divider }}
      >
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className='w-[72px] flex flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-white'
        >
          <Store className='w-5 h-5' />
          <span className='text-[10px] leading-none'>โปรไฟล์</span>
        </Button>
        <div className='w-px bg-violet-100/70' />
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void toggleFavorite(item.id)}
          className='w-[72px] flex flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-white'
          aria-label='ถูกใจ'
        >
          <Heart
            className='w-5 h-5 shrink-0'
            style={liked ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' } : {}}
          />
          <span className='text-[10px] leading-none text-gray-500'>{likeCount}</span>
        </Button>
        <Button
          variant='unstyled'
          type='button'
          onClick={canChat ? handleStartChat : () => navigate(`/factories/${item.factoryId}`)}
          disabled={starting}
          className='flex-1 flex items-center justify-center gap-2 text-white font-bold text-[14px] disabled:opacity-70'
          style={{
            background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
          }}
        >
          {starting ? (
            <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
          ) : (
            <MessageCircle className='w-4 h-4' />
          )}
          {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
        </Button>
      </div>
    </div>
  );
}
