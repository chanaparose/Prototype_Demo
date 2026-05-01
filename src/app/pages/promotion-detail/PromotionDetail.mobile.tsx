import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  Store,
  TicketPercent,
} from 'lucide-react';

import { ImageWithFallback } from '../../components/shared';
import { usePromotionDetailShowcase } from '../../hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';
import { useFactoryReviewSummary } from '../../hooks/useFactoryReviewSummary';
import { useFactoryReviewList } from '../../hooks/useFactoryReviewList';
import { useFavorites } from '../../hooks/useFavorites';

const BRAND = {
  rose: '#E11D48',
  roseSoft: '#FFF1F5',
  orange: '#E38844',
  orangeSoft: '#FFF4E8',
  purple: '#7A4B94',
  purpleSoft: '#F8F6FA',
  ink: '#2E2252',
  border: '#EDE7F1',
  divider: '#F2F2F2',
} as const;

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function normalizeMarkdownContent(raw: unknown): string {
  const s = String(raw ?? '');
  if (!s) return '';
  return s
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .trim();
}

function formatTHB(value: number | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value);
}

function daysBetween(a: Date, b: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / oneDay));
}

function promoMeta(startDate?: string, endDate?: string) {
  const now = new Date();
  const s = startDate ? new Date(startDate) : null;
  const e = endDate ? new Date(endDate) : null;
  const sOk = s && !Number.isNaN(s.getTime());
  const eOk = e && !Number.isNaN(e.getTime());

  if (!sOk || !eOk) return { status: 'โปรโมชัน', hint: 'กรุณาตรวจสอบวันเริ่มและวันสิ้นสุด' };
  if (now < s!) return { status: 'โปรใกล้เริ่ม', hint: `เริ่มในอีก ${daysBetween(now, s!)} วัน` };
  if (now > e!) return { status: 'หมดโปรแล้ว', hint: `สิ้นสุดเมื่อ ${formatThaiDate(endDate!)}` };
  return { status: 'กำลังจัดโปร', hint: `เหลืออีก ${daysBetween(now, e!)} วัน` };
}

export function PromotionDetailMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId, relatedShowcases } = usePromotionDetailShowcase();
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
      <div className="flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button type="button" onClick={handleBack} className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: BRAND.purple }}>
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {error ?? 'ไม่พบข้อมูลโปรโมชัน'}
        </div>
      </div>
    );
  }

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
  const breakdown = summary?.rating_breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const latestReviews = reviewListQ.data ?? [];

  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PM',
      id: Number(resolvedId),
      title: item.title,
    });

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-[72px]">
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <ImageWithFallback src={gallery[activeImage] ?? item.image} alt={item.title} className="w-full h-full object-cover" />
        <button type="button" onClick={handleBack} className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'rgba(225,29,72,0.86)' }}>
          โปรโมชัน
        </span>
      </div>

      {gallery.length > 1 ? (
        <div className="bg-white px-3 py-2 border-b" style={{ borderColor: BRAND.divider }}>
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setActiveImage(idx)}
                className="shrink-0 w-14 h-14 rounded-md overflow-hidden border-2"
                style={{ borderColor: idx === activeImage ? BRAND.rose : BRAND.border }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white px-4 pt-4 pb-3">
        <p className="text-[22px] font-medium leading-none text-slate-600">{priceText}</p>
        {item.basePrice != null && item.promoPrice != null && item.basePrice > item.promoPrice ? (
          <p className="text-[13px] text-gray-400 line-through mt-1">{formatTHB(item.basePrice)}</p>
        ) : null}
        <h1 className="mt-2 text-[15px] font-medium leading-snug" style={{ color: BRAND.ink }}>{item.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-current" style={{ color: BRAND.orange }} /> {avgRating.toFixed(1)}</span>
          <span>{reviewCount} รีวิว</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => void toggleFavorite(item.id)}
            className="inline-flex items-center gap-1 active:opacity-70"
          >
            <Heart className="w-3 h-3" style={liked ? { color: '#EF4444', fill: '#EF4444' } : { color: BRAND.orange }} />
            {likeCount} คนสนใจ
          </button>
        </div>
      </div>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      <div className="bg-white px-4 py-3 rounded-none">
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-rose-700">ช่วงเวลาโปรโมชัน</p>
            <span className="text-xs font-semibold text-rose-700">{promo.status}</span>
          </div>
          <p className="text-xs text-rose-700 mt-1 inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {promo.hint}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white border border-rose-100 p-2">
              <p className="text-gray-500">วันที่เริ่ม</p>
              <p className="font-semibold text-gray-800">{item.startDate ? formatThaiDate(item.startDate) : '-'}</p>
            </div>
            <div className="rounded-lg bg-white border border-rose-100 p-2">
              <p className="text-gray-500">วันที่สิ้นสุด</p>
              <p className="font-semibold text-gray-800">{item.endDate ? formatThaiDate(item.endDate) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="block w-full text-left bg-white px-4 py-4 active:opacity-90">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border shrink-0" style={{ borderColor: BRAND.border }}>
            <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[13px] font-semibold truncate" style={{ color: BRAND.ink }}>{item.factoryName}</p>
              {factory?.verified ? <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND.purple }} /> : null}
            </div>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
              <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {factory?.location || '-'}</span>
            </div>
          </div>
        </div>
      </button>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      <div className="bg-white px-4 py-3">
        <p className="text-[13px] font-bold mb-2" style={{ color: BRAND.ink }}>รายละเอียดสินค้า (Markdown)</p>
        {markdown ? (
          <>
            <MarkdownBody source={markdown} className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
            />
          </>
        ) : <p className="text-[12px] text-gray-400">ยังไม่มีรายละเอียดเพิ่มเติม</p>}
      </div>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      <div className="bg-white px-4 py-3">
        <p className="text-[13px] font-bold mb-2" style={{ color: BRAND.ink }}>คะแนนรีวิว</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[28px] leading-none font-bold" style={{ color: BRAND.orange }}>{avgRating.toFixed(1)}</p>
            <p className="text-[11px] text-gray-500 mt-1">{reviewCount} รีวิว</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(breakdown[String(star)] ?? 0);
              const intensity =
                reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] text-gray-500">{star}★</span>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${intensity}%`, background: BRAND.orange }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
          <p className="text-[12px] font-semibold" style={{ color: BRAND.ink }}>รีวิวล่าสุดจากลูกค้า</p>
          {latestReviews.length === 0 ? (
            <p className="text-[11px] text-gray-400">ยังไม่มีรีวิว</p>
          ) : (
            latestReviews.slice(0, 2).map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-700 truncate">{r.reviewer}</p>
                  <p className="text-[11px] text-amber-600">★ {Number(r.rating || 0).toFixed(1)}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.comment || '-'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      <div className="bg-white px-4 py-3">
        <p className="text-[13px] font-bold mb-2" style={{ color: BRAND.ink }}>สินค้าที่ใกล้เคียง</p>
        {relatedShowcases.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {relatedShowcases.slice(0, 4).map((rp) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => navigate(`/promotion-detail?showcase_id=${rp.id}`)}
                className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer text-left"
              >
                <div className="relative h-[150px] shrink-0 bg-gray-100">
                  <ImageWithFallback src={rp.image} alt={rp.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 z-[1] px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: BRAND.rose }}>โปรโมชัน</span>
                </div>
                <div className="p-3 flex flex-col flex-1 min-w-0">
                  <h3 className="text-xs font-bold leading-[18px] line-clamp-2 min-h-[36px]" style={{ color: BRAND.ink }}>{rp.title}</h3>
                  <p className="text-[10px] leading-[14px] text-gray-400 mt-1 line-clamp-2 min-h-[28px]">{rp.excerpt || 'รายละเอียดสินค้า'}</p>
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-semibold truncate" style={{ color: BRAND.ink }}>{rp.factoryName}</p>
                    <div className="flex items-center justify-between min-w-0 mt-1">
                      <span className="text-[10px] text-gray-400">MOQ <span className="font-semibold" style={{ color: BRAND.ink }}>{rp.minOrder || '-'}</span></span>
                      <span className="text-[10px] text-gray-400 inline-flex items-center gap-1"><Heart className="w-3 h-3" />{rp.likes}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-400 py-4">ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex items-stretch h-[60px]" style={{ borderColor: BRAND.divider }}>
        <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="w-[72px] flex flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50">
          <Store className="w-5 h-5" />
          <span className="text-[10px] leading-none">โปรไฟล์</span>
        </button>
        <div className="w-px bg-gray-100" />
        <button
          type="button"
          onClick={canChat ? handleStartChat : () => navigate(`/factories/${item.factoryId}`)}
          disabled={starting}
          className="flex-1 flex items-center justify-center gap-2 text-white font-bold text-[14px] disabled:opacity-70"
          style={{ background: BRAND.orange }}
        >
          <MessageCircle className="w-4 h-4" />
          {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
        </button>
      </div>
    </div>
  );
}
