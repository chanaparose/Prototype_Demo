import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Chevron,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Store,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { useProductDetailShowcase } from '../../hooks/useProductDetailShowcase';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../stores';
import { useData } from '../../stores';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';
import { useFactoryReviewSummary } from '../../hooks/useFactoryReviewSummary';
import { useFactoryReviewList } from '../../hooks/useFactoryReviewList';
import { useFavorites } from '../../hooks/useFavorites';

// Aligned with Explore page palette — vibrant brand purple + bright accent orange
const BRAND = {
  orange: '#F28A2E',      // Explore primary orange
  orangeDark: '#F27830',  // Explore hover orange
  orangeSoft: '#FFF4E8',
  purple: '#A238FF',      // Explore vibrant brand purple
  purpleSoft: '#F5F3FF',  // softer page background for readability
  ink: '#1A0A2E',         // Explore deepest text
  border: '#E7E2F0',
} as const;

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
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
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductDetailDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const data = useData();
  const { item, loading, error, factory, isIdea, isMaterial, resolvedId, relatedProducts } = useProductDetailShowcase();
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

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    setActiveImage(0);
  }, [item?.id]);

  if (loading) {
    return (
      <div
        className="hidden min-h-[calc(100vh-4rem)] items-center justify-center lg:flex"
        style={{ background: BRAND.purpleSoft }}
      >
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div
        className="hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)]"
        style={{ background: BRAND.purpleSoft }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-[14px] text-gray-500 font-medium">{error || 'ไม่พบข้อมูลสินค้า'}</p>
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim() ?? null;
  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PD',
      id: Number(resolvedId),
      title: item.title,
    });

  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');
  const priceText = formatTHB(item.basePrice) ?? (item.priceRange?.trim() || null);
  const liked = item ? isLiked(item.id) : false;
  const likeCount = item ? item.likes + (liked ? 1 : 0) : 0;
  const summary = reviewSummaryQ.data;
  const avgRating = Number(summary?.average_rating ?? factory?.rating ?? 0);
  const reviewCount = Number(summary?.review_count ?? factory?.reviews ?? 0);
  const breakdown = summary?.rating_breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const latestReviews = reviewListQ.data ?? [];

  // ── Spec rows for the specifications table ──
  const specRows: { label: string; value: React.ReactNode }[] = [];
  if (item.category) specRows.push({ label: 'หมวดหมู่', value: item.category });
  if (subName && !isMaterial) specRows.push({ label: 'ประเภทย่อย', value: subName });
  specRows.push({ label: 'ขั้นต่ำการสั่งผลิต', value: `${item.minOrder} ชิ้น (MOQ)` });
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
    <div className="hidden lg:block min-h-[calc(100vh-4rem)]" style={{ background: '#F6F4FB' }}>
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
          <Chevron className="w-3 h-3 text-gray-300" />
          <span>{item.category || 'ทั้งหมด'}</span>
          {subName && !isMaterial ? (
            <>
              <Chevron className="w-3 h-3 text-gray-300" />
              <span>{subName}</span>
            </>
          ) : null}
          <Chevron className="w-3 h-3 text-gray-300" />
          <span className="truncate max-w-[32rem]" style={{ color: BRAND.ink }}>{item.title}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-8 pb-10 space-y-4">

        {/* ── Main product card (gallery + info) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex gap-8">
            {/* ── Left: Gallery ── */}
            <div className="w-[450px] shrink-0">
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden border"
                style={{ borderColor: BRAND.border, background: '#F5F5F5' }}
              >
                <ImageWithFallback
                  src={gallery[activeImage] ?? item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImage((p) => (p - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
                      aria-label="รูปก่อนหน้า"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImage((p) => (p + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
                      aria-label="รูปถัดไป"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums">
                      {activeImage + 1} / {gallery.length}
                    </span>
                  </>
                ) : null}
              </div>

              {gallery.length > 1 ? (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {gallery.slice(0, 5).map((url, idx) => {
                    const active = idx === activeImage;
                    return (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onMouseEnter={() => setActiveImage(idx)}
                        onClick={() => setActiveImage(idx)}
                        className="aspect-square rounded-lg overflow-hidden border-2 transition-colors"
                        style={{ borderColor: active ? BRAND.orange : BRAND.border }}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* share / favorites row */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      void navigator.share({ title: item.title, url: window.location.href });
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      void navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" /> แชร์สินค้านี้
                </button>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(item.id)}
                  className="inline-flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                >
                  <Heart className="w-4 h-4" style={liked ? { color: '#EF4444', fill: '#EF4444' } : { color: BRAND.orange }} />
                  {likeCount} สนใจ
                </button>
              </div>
            </div>

            {/* ── Right: Info ── */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {factory?.verified ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold text-white"
                    style={{ background: BRAND.orange }}
                  >
                    <BadgeCheck className="w-3 h-3" /> Preferred
                  </span>
                ) : null}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold"
                  style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
                >
                  {isIdea ? 'ไอเดีย / บทความ' : isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
                </span>
                {item.category ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium text-gray-500 border border-gray-200">
                    {item.category}
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="text-[20px] leading-snug font-medium" style={{ color: BRAND.ink }}>
                {item.title}
              </h1>

              {/* Sub info row (rating / sold / posted) */}
              <div className="flex items-center gap-4 py-3 mt-1 border-b border-gray-100 text-[13px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span
                    className="border-b"
                    style={{ color: BRAND.orange, borderColor: BRAND.orange }}
                  >
                    {avgRating.toFixed(1)}
                  </span>
                  <Star className="w-3.5 h-3.5 fill-current" style={{ color: BRAND.orange }} />
                </span>
                <span className="h-3 w-px bg-gray-200" />
                <span>
                  <span className="text-gray-700 border-b border-gray-300">
                    {reviewCount}
                  </span>
                  <span className="ml-1">รีวิว</span>
                </span>
                <span className="h-3 w-px bg-gray-200" />
                <span>
                  <span className="text-gray-700">{likeCount}</span>
                  <span className="ml-1">คนสนใจ</span>
                </span>
                <span className="h-3 w-px bg-gray-200" />
                <span>เผยแพร่ {formatThaiDate(item.postedAt)}</span>
              </div>

              {/* Price block */}
              <div
                className="mt-4 px-4 py-4 rounded-xl border"
                style={{ background: '#FFF9F2', borderColor: '#F8DEC1' }}
              >
                {priceText ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-[26px] font-bold leading-none" style={{ color: '#7C3AED' }}>
                      {priceText}
                    </p>
                    {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
                      <p className="text-[14px] line-through text-gray-400">
                        {formatTHB(item.basePrice)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[20px] font-semibold leading-none" style={{ color: '#7C3AED' }}>
                    สอบถามราคากับโรงงาน
                  </p>
                )}
                <p className="text-[11px] text-gray-500 mt-2">
                  ราคาต่อชิ้นอาจแตกต่างตามปริมาณสั่งผลิต กรุณาแชทเพื่อขอใบเสนอราคา
                </p>
              </div>

              {/* Info grid rows (MOQ / Lead time / location) */}
              <div className="mt-5 grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                <span className="text-gray-400">ขั้นต่ำผลิต</span>
                <span style={{ color: BRAND.ink }}>
                  <span className="font-semibold">{item.minOrder}</span>{' '}
                  <span className="text-gray-500">ชิ้น (MOQ)</span>
                </span>

                {item.leadTime ? (
                  <>
                    <span className="text-gray-400">ระยะเวลาผลิต</span>
                    <span style={{ color: BRAND.ink }}>{item.leadTime}</span>
                  </>
                ) : null}

                {factory?.location ? (
                  <>
                    <span className="text-gray-400">สถานที่ผลิต</span>
                    <span className="inline-flex items-center gap-1" style={{ color: BRAND.ink }}>
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {factory.location}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Tag chips */}
              {item.tags.length > 0 ? (
                <div className="mt-5 grid grid-cols-[120px_1fr] gap-x-4 items-start text-[13px]">
                  <span className="text-gray-400 pt-1">แท็ก</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-sm text-[11px] font-medium cursor-pointer transition-colors hover:opacity-80"
                        style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* CTA row */}
              <div className="mt-6 flex items-center gap-3">
                {canChat ? (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={starting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-semibold transition-colors disabled:opacity-70"
                    style={{
                      background: BRAND.orangeSoft,
                      color: BRAND.orangeDark,
                      border: `1px solid ${BRAND.orange}`,
                    }}
                  >
                    {starting ? (
                      <span
                        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: BRAND.orangeDark }}
                      />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    แชทกับโรงงาน
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 rounded-md text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: BRAND.orange }}
                >
                  <Store className="w-4 h-4" />
                  ดูโปรไฟล์โรงงาน
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Shop card (horizontal) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-fit shrink-0 rounded-2xl">
                <div
                  className={`relative block h-17 w-17 overflow-hidden rounded-2xl border-2 shadow-md ring-1 ring-white ${
                    factory?.image ? 'border-white' : 'border-dashed border-indigo-200 bg-violet-50'
                  }`}
                >
                  {factory?.image ? (
                    <ImageWithFallback
                      src={factory.image}
                      alt={item.factoryName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center">
                      <ImageIcon size={20} className="text-indigo-400" strokeWidth={1.5} />
                      <span className="text-[9px] font-semibold leading-tight text-indigo-600">โปรไฟล์</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-semibold truncate" style={{ color: BRAND.ink }}>
                    {item.factoryName}
                  </p>
                  {factory?.verified ? (
                    <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: BRAND.purple }} />
                  ) : null}
                </div>
                <p className="text-[12px] text-gray-500 truncate mt-0.5">
                  {factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {canChat ? (
                    <button
                      type="button"
                      onClick={handleStartChat}
                      disabled={starting}
                      className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-sm text-[13px] font-medium transition-colors disabled:opacity-70"
                      style={{
                        background: BRAND.orangeSoft,
                        color: BRAND.orangeDark,
                        border: `1px solid ${BRAND.orange}`,
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> แชท
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => navigate(`/factories/${item.factoryId}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-sm text-[13px] font-medium transition-colors hover:opacity-80"
                    style={{ border: `1px solid ${BRAND.border}`, color: '#374151' }}
                  >
                    <Store className="w-3.5 h-3.5" /> ดูโรงงาน
                  </button>
                </div>
              </div>
            </div>

            <div className="w-px h-24 bg-gray-100 mx-2" />

            <div className="grid grid-cols-3 gap-6 text-[13px] flex-1">
              <div>
                <p className="text-gray-400 mb-1">เรตติ้งเฉลี่ย</p>
                <p className="font-semibold" style={{ color: BRAND.orange }}>
                  {avgRating.toFixed(1)}{' '}
                  <span className="text-[11px] text-gray-400">/ 5.0</span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">รีวิวทั้งหมด</p>
                <p className="font-semibold" style={{ color: BRAND.orange }}>
                  {reviewCount}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">ออเดอร์ที่เสร็จแล้ว</p>
                <p className="font-semibold" style={{ color: BRAND.orange }}>
                  {factory?.completedOrders ?? 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">ที่ตั้ง</p>
                <p className="font-semibold" style={{ color: BRAND.ink }}>
                  {factory?.location ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">MOQ เริ่มต้น</p>
                <p className="font-semibold" style={{ color: BRAND.ink }}>
                  {factory?.minOrder ?? item.minOrder}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Lead time</p>
                <p className="font-semibold" style={{ color: BRAND.ink }}>
                  {factory?.leadTime || item.leadTime || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Specifications ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-6 py-3 border-b"
            style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}
          >
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>
              ข้อมูลจำเพาะของสินค้า
            </p>
          </div>
          <div className="p-6">
            <table className="w-full text-[13px]">
              <tbody>
                {specRows.map((row, idx) => (
                  <tr
                    key={`${row.label}-${idx}`}
                    className="border-b last:border-0"
                    style={{ borderColor: BRAND.border }}
                  >
                    <td className="py-2.5 pr-6 w-48 text-gray-500 align-top">{row.label}</td>
                    <td className="py-2.5" style={{ color: BRAND.ink }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-6 py-3 border-b"
            style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}
          >
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>
              รายละเอียดสินค้า
            </p>
          </div>
          <div className="p-6">
            {markdown ? (
              <>
                <MarkdownBody
                  source={markdown}
                  className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
                />
              </>
            ) : (
              <p className="text-[13px] text-gray-400">ยังไม่มีรายละเอียดเพิ่มเติม</p>
            )}
          </div>
        </div>

        {/* ── Review score ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b" style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}>
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>
              คะแนนรีวิว
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[34px] leading-none font-bold" style={{ color: BRAND.orange }}>
                  {avgRating.toFixed(1)}
                </p>
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
            <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
              <p className="text-[13px] font-semibold" style={{ color: BRAND.ink }}>รีวิวล่าสุดจากลูกค้า</p>
              {latestReviews.length === 0 ? (
                <p className="text-[12px] text-gray-400">ยังไม่มีรีวิว</p>
              ) : (
                latestReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-gray-700 truncate">{r.reviewer}</p>
                      <p className="text-[11px] text-amber-600">★ {Number(r.rating || 0).toFixed(1)}</p>
                    </div>
                    <p className="text-[12px] text-gray-600 mt-1 line-clamp-2">{r.comment || '-'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── CTA banner (bottom) ── */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
        >
          <div className="min-w-0">
            <p className="text-[13px]" style={{ color: '#EBD3FF' }}>สนใจผลิตกับโรงงานนี้?</p>
            <p className="text-[16px] font-bold text-white mt-0.5 truncate">
              แชทสอบถามรายละเอียด พร้อมขอใบเสนอราคาได้ทันที
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canChat ? (
              <button
                type="button"
                onClick={handleStartChat}
                disabled={starting}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-md text-[13px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{ background: BRAND.orange }}
              >
                {starting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                แชทกับโรงงาน
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(`/factories/${item.factoryId}`)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.45)' }}
            >
              <ArrowUpRight className="w-4 h-4" /> ดูโปรไฟล์โรงงาน
            </button>
          </div>
        </div>

        {/* ── Related products ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b" style={{ background: BRAND.purpleSoft, borderColor: BRAND.border }}>
            <p className="text-[14px] font-bold" style={{ color: BRAND.ink }}>
              สินค้าที่ใกล้เคียง
            </p>
          </div>
          {relatedProducts.length > 0 ? (
            <div className="p-6 grid grid-cols-4 gap-3">
              {relatedProducts.map((rp) => {
                const rf = data.factories.find((f) => f.id === rp.factoryId);
                const rating = Number(rf?.rating ?? rp.factoryRating ?? 0);
                const reviews = Number(rf?.reviews ?? 0);
                const isPromo = rp.contentType === 'promotion';
                return (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => navigate(`/${isPromo ? 'promotion-detail' : 'product-detail'}?showcase_id=${rp.id}`)}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col w-full text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={rp.image}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: isPromo ? BRAND.orange : '#2563EB' }}
                      >
                        {isPromo ? 'โปรโมชัน' : 'สินค้า'}
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <div>
                        <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                          {rp.title}
                        </p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500 text-[10px] truncate">
                            {(rf?.provinceName ?? rf?.location ?? '').trim() || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">{rating}</span>
                            <span className="text-gray-400 text-[9px] truncate">({reviews})</span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {rp.minOrder}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้</div>
          )}
        </div>
      </div>
    </div>
  );
}
