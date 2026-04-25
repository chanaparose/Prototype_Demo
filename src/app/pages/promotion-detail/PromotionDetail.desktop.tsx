import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
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

export function PromotionDetailDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId, relatedShowcases } = usePromotionDetailShowcase();
  const reviewSummaryQ = useFactoryReviewSummary(item?.factoryId ?? null);
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
      <div className="hidden min-h-[calc(100vh-4rem)] items-center justify-center lg:flex" style={{ background: BRAND.purpleSoft }}>
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)]" style={{ background: BRAND.purpleSoft }}>
        <button type="button" onClick={handleBack} className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: BRAND.purple }}>
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-[14px] text-gray-500 font-medium">{error || 'ไม่พบข้อมูลโปรโมชัน'}</p>
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
  const breakdown = summary?.rating_breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PM',
      id: Number(resolvedId),
      title: item.title,
    });

  return (
    <div className="hidden lg:block min-h-[calc(100vh-4rem)]" style={{ background: BRAND.purpleSoft }}>
      {/* ── Breadcrumb / back row ── */}
      <div className="px-8 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 font-medium hover:opacity-80"
            style={{ color: BRAND.purple }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับ
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span>{item.category || 'ทั้งหมด'}</span>
          {subName ? (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span>{subName}</span>
            </>
          ) : null}
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="truncate max-w-[32rem]" style={{ color: BRAND.ink }}>{item.title}</span>
        </div>
      </div>

      <div className="px-8 pb-10 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex gap-8">
            <div className="w-[450px] shrink-0">
              <div className="relative aspect-square rounded-xl overflow-hidden border" style={{ borderColor: BRAND.border, background: '#F5F5F5' }}>
                <ImageWithFallback src={gallery[activeImage] ?? item.image} alt={item.title} className="w-full h-full object-cover" />
                {gallery.length > 1 ? (
                  <>
                    <button type="button" onClick={() => setActiveImage((p) => (p - 1 + gallery.length) % gallery.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => setActiveImage((p) => (p + 1) % gallery.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : null}
              </div>
              {gallery.length > 1 ? (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {gallery.slice(0, 5).map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className="aspect-square rounded-lg overflow-hidden border-2"
                      style={{ borderColor: idx === activeImage ? BRAND.rose : BRAND.border }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold text-white" style={{ background: BRAND.rose }}>
                  <TicketPercent className="w-3 h-3" /> โปรโมชัน
                </span>
                {factory?.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold text-white" style={{ background: BRAND.orange }}>
                    <BadgeCheck className="w-3 h-3" /> Preferred
                  </span>
                ) : null}
              </div>

              <h1 className="text-[20px] leading-snug font-medium" style={{ color: BRAND.ink }}>{item.title}</h1>

              <div className="flex items-center gap-4 py-3 mt-1 border-b border-gray-100 text-[13px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="border-b" style={{ color: BRAND.orange, borderColor: BRAND.orange }}>{avgRating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-current" style={{ color: BRAND.orange }} />
                </span>
                <span>{reviewCount} รีวิว</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(item.id)}
                  className="inline-flex items-center gap-1 active:opacity-70"
                >
                  <Heart className="w-3.5 h-3.5" style={liked ? { color: '#EF4444', fill: '#EF4444' } : { color: BRAND.orange }} />
                  {likeCount} คนสนใจ
                </button>
              </div>

              <div className="mt-4 px-4 py-3 rounded-md" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-[22px] font-medium leading-none text-gray-800">{priceText}</p>
                {item.basePrice != null && item.promoPrice != null && item.basePrice > item.promoPrice ? (
                  <p className="text-[12px] text-gray-400 line-through mt-1">{formatTHB(item.basePrice)}</p>
                ) : null}
              </div>

              <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-rose-700">ช่วงเวลาโปรโมชัน</p>
                  <span className="text-xs font-semibold text-rose-700">{promo.status}</span>
                </div>
                <p className="text-xs text-rose-700 mt-1 inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {promo.hint}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
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

              <div className="mt-6 flex items-center gap-3">
                {canChat ? (
                  <button type="button" onClick={handleStartChat} disabled={starting} className="flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-semibold" style={{ background: BRAND.orangeSoft, color: BRAND.orange, border: `1px solid ${BRAND.orange}` }}>
                    <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
                  </button>
                ) : null}
                <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-bold text-white" style={{ background: BRAND.orange }}>
                  <Store className="w-4 h-4" /> ดูโปรไฟล์โรงงาน
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border shrink-0" style={{ borderColor: BRAND.border }}>
                <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-semibold truncate" style={{ color: BRAND.ink }}>{item.factoryName}</p>
                  {factory?.verified ? <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: BRAND.purple }} /> : null}
                </div>
                <p className="text-[12px] text-gray-500 truncate mt-0.5">{factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}</p>
                <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {factory?.location || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-[13px] flex-1">
              <div><p className="text-gray-400 mb-1">เรตติ้งเฉลี่ย</p><p className="font-semibold" style={{ color: BRAND.orange }}>{avgRating.toFixed(1)}</p></div>
              <div><p className="text-gray-400 mb-1">รีวิวทั้งหมด</p><p className="font-semibold" style={{ color: BRAND.orange }}>{reviewCount}</p></div>
              <div><p className="text-gray-400 mb-1">ออเดอร์ที่เสร็จแล้ว</p><p className="font-semibold" style={{ color: BRAND.orange }}>{factory?.completedOrders ?? 0}</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b" style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}>
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>รายละเอียดสินค้า (Markdown)</p>
          </div>
          <div className="p-6">
            {markdown ? (
              <>
                <MarkdownBody source={markdown} className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
                />
              </>
            ) : <p className="text-[13px] text-gray-400">ยังไม่มีรายละเอียดเพิ่มเติม</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b" style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}>
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>คะแนนรีวิว</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[34px] leading-none font-bold" style={{ color: BRAND.orange }}>{avgRating.toFixed(1)}</p>
                <p className="text-[12px] text-gray-500 mt-1">จาก {reviewCount} รีวิว</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(breakdown[String(star)] ?? 0);
                  const intensity =
                    reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-10 text-[12px] text-gray-500">{star} ดาว</span>
                      <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${intensity}%`, background: BRAND.orange }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b" style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}>
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>สินค้าที่ใกล้เคียง</p>
          </div>
          {relatedShowcases.length > 0 ? (
            <div className="p-6 grid grid-cols-4 gap-4">
              {relatedShowcases.map((rp) => (
                <button
                  key={rp.id}
                  type="button"
                  onClick={() => navigate(`/promotion-detail?showcase_id=${rp.id}`)}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <div className="relative h-36 overflow-hidden bg-gray-100">
                    <ImageWithFallback src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: BRAND.rose }}>โปรโมชัน</span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2 min-h-0">
                    <h3 className="text-[12px] font-bold line-clamp-2 leading-snug min-h-[36px]" style={{ color: BRAND.ink }}>{rp.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 min-h-[28px]">{rp.excerpt || 'รายละเอียดสินค้า'}</p>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-semibold truncate" style={{ color: BRAND.ink }}>{rp.factoryName}</p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-400">
                        <span className="min-w-0 truncate">MOQ <span className="font-semibold" style={{ color: BRAND.ink }}>{rp.minOrder || '-'}</span></span>
                        <span className="inline-flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {rp.likes}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้</div>
          )}
        </div>
      </div>
    </div>
  );
}
