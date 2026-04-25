import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight as Chevron,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Store,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { useProductDetailShowcase } from '../../hooks/useProductDetailShowcase';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';

const BRAND = {
  orange: '#E38844',
  orangeDark: '#C9722F',
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

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, isIdea, resolvedId, relatedProducts } = useProductDetailShowcase();

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
      <div className="flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-1 text-sm"
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {error ?? 'ไม่พบข้อมูลสินค้า'}
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

  // ── Spec rows ──
  const specRows: { label: string; value: string }[] = [];
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
    <div className="min-h-screen bg-[#F5F5F5] pb-[72px]">
      {/* ── Image carousel (full width, square) ── */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <ImageWithFallback
          src={gallery[activeImage] ?? item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />

        {/* back + share buttons */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="กลับ"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button
          type="button"
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="แชร์"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              void navigator.share({ title: item.title, url: window.location.href });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              void navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <Share2 className="w-5 h-5 text-white" />
        </button>

        {/* page indicator */}
        {gallery.length > 1 ? (
          <span className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums">
            {activeImage + 1} / {gallery.length}
          </span>
        ) : null}
      </div>

      {/* thumbnails strip */}
      {gallery.length > 1 ? (
        <div className="bg-white px-3 py-2 border-b" style={{ borderColor: BRAND.divider }}>
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((url, idx) => {
              const active = idx === activeImage;
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className="shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors"
                  style={{ borderColor: active ? BRAND.orange : BRAND.border }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── Price + title ── */}
      <div className="bg-white px-4 pt-4 pb-3">
        <div className="flex items-baseline gap-2">
          {priceText ? (
            <p className="text-[24px] font-semibold leading-none" style={{ color: BRAND.orangeDark }}>
              {priceText}
            </p>
          ) : (
            <p className="text-[18px] font-semibold leading-none" style={{ color: BRAND.orangeDark }}>
              สอบถามราคากับโรงงาน
            </p>
          )}
          {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
            <p className="text-[13px] line-through text-gray-400">{formatTHB(item.basePrice)}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {factory?.verified ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-white"
              style={{ background: BRAND.orange }}
            >
              <BadgeCheck className="w-2.5 h-2.5" /> Preferred
            </span>
          ) : null}
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-semibold"
            style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
          >
            {isIdea ? 'ไอเดีย' : 'สินค้า'}
          </span>
          {item.category ? (
            <span className="text-[10px] text-gray-500">{item.category}</span>
          ) : null}
        </div>

        <h1 className="mt-2 text-[15px] font-medium leading-snug" style={{ color: BRAND.ink }}>
          {item.title}
        </h1>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="border-b" style={{ color: BRAND.orange, borderColor: BRAND.orange }}>
              {Number(factory?.rating ?? 0).toFixed(1)}
            </span>
            <Star className="w-3 h-3 fill-current" style={{ color: BRAND.orange }} />
          </span>
          <span>{factory?.reviews ?? 0} รีวิว</span>
          <span>•</span>
          <span>{item.likes} สนใจ</span>
        </div>
      </div>

      {/* divider strip */}
      <div className="h-2" style={{ background: '#F5F5F5' }} />

      {/* ── Info rows ── */}
      <div className="bg-white px-4 py-3">
        <div className="divide-y" style={{ borderColor: BRAND.divider }}>
          <div className="flex items-start justify-between py-2.5">
            <span className="text-[12px] text-gray-500 shrink-0">ขั้นต่ำผลิต</span>
            <span className="text-[12px] text-right ml-4" style={{ color: BRAND.ink }}>
              <span className="font-semibold">{item.minOrder}</span>{' '}
              <span className="text-gray-500">ชิ้น (MOQ)</span>
            </span>
          </div>
          {item.leadTime ? (
            <div className="flex items-start justify-between py-2.5 border-t" style={{ borderColor: BRAND.divider }}>
              <span className="text-[12px] text-gray-500 shrink-0">ระยะเวลาผลิต</span>
              <span className="text-[12px] text-right ml-4" style={{ color: BRAND.ink }}>{item.leadTime}</span>
            </div>
          ) : null}
          {factory?.location ? (
            <div className="flex items-start justify-between py-2.5 border-t" style={{ borderColor: BRAND.divider }}>
              <span className="text-[12px] text-gray-500 shrink-0">สถานที่ผลิต</span>
              <span className="text-[12px] text-right ml-4 inline-flex items-center gap-1" style={{ color: BRAND.ink }}>
                <MapPin className="w-3 h-3 text-gray-400" /> {factory.location}
              </span>
            </div>
          ) : null}
          <div className="flex items-start justify-between py-2.5 border-t" style={{ borderColor: BRAND.divider }}>
            <span className="text-[12px] text-gray-500 shrink-0">เผยแพร่</span>
            <span className="text-[12px] text-right ml-4" style={{ color: BRAND.ink }}>
              {formatThaiDate(item.postedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* tags */}
      {item.tags.length > 0 ? (
        <>
          <div className="h-2" style={{ background: '#F5F5F5' }} />
          <div className="bg-white px-4 py-3">
            <p className="text-[12px] font-semibold mb-2" style={{ color: BRAND.ink }}>แท็กสินค้า</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-medium"
                  style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* divider */}
      <div className="h-2" style={{ background: '#F5F5F5' }} />

      {/* ── Shop card ── */}
      <button
        type="button"
        onClick={() => navigate(`/factories/${item.factoryId}`)}
        className="block w-full text-left bg-white px-4 py-4 active:opacity-90"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full overflow-hidden border shrink-0"
            style={{ borderColor: BRAND.border }}
          >
            <ImageWithFallback
              src={factory?.image ?? ''}
              alt={item.factoryName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[13px] font-semibold truncate" style={{ color: BRAND.ink }}>
                {item.factoryName}
              </p>
              {factory?.verified ? (
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND.purple }} />
              ) : null}
            </div>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}
            </p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
              <span className="inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400" style={{ color: BRAND.orange }} />
                <span className="font-semibold" style={{ color: BRAND.ink }}>
                  {Number(factory?.rating ?? 0).toFixed(1)}
                </span>
              </span>
              {factory?.location ? (
                <span className="inline-flex items-center gap-0.5 truncate">
                  <MapPin className="w-3 h-3" /> {factory.location}
                </span>
              ) : null}
            </div>
          </div>
          <Chevron className="w-4 h-4 text-gray-300 shrink-0" />
        </div>
      </button>

      {/* divider */}
      <div className="h-2" style={{ background: '#F5F5F5' }} />

      {/* ── Specifications ── */}
      <div className="bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-bold" style={{ color: BRAND.ink }}>
            ข้อมูลจำเพาะของสินค้า
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: BRAND.divider }}>
          {specRows.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className="flex items-start justify-between py-2 gap-3"
              style={idx > 0 ? { borderTop: `1px solid ${BRAND.divider}` } : undefined}
            >
              <span className="text-[12px] text-gray-500 w-32 shrink-0">{row.label}</span>
              <span className="text-[12px] text-right flex-1" style={{ color: BRAND.ink }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* divider */}
      <div className="h-2" style={{ background: '#F5F5F5' }} />

      {/* ── Description ── */}
      <div className="bg-white px-4 py-3">
        <p className="text-[13px] font-bold mb-2" style={{ color: BRAND.ink }}>
          รายละเอียดสินค้า
        </p>
        {markdown ? (
          <MarkdownBody
            source={markdown}
            className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
          />
        ) : (
          <p className="text-[12px] text-gray-400">ยังไม่มีรายละเอียดเพิ่มเติม</p>
        )}
      </div>

      <div className="h-2" style={{ background: '#F5F5F5' }} />

      {/* ── Review score ── */}
      <div className="bg-white px-4 py-3">
        <p className="text-[13px] font-bold mb-2" style={{ color: BRAND.ink }}>
          คะแนนรีวิว
        </p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[28px] leading-none font-bold" style={{ color: BRAND.orange }}>
              {Number(factory?.rating ?? 0).toFixed(1)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">{factory?.reviews ?? 0} รีวิว</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const rating = Number(factory?.rating ?? 0);
              const intensity = Math.max(0, Math.min(100, ((rating - (star - 1)) / 1) * 100));
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
      </div>

      <>
        <div className="h-2" style={{ background: '#F5F5F5' }} />
        <div className="bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold" style={{ color: BRAND.ink }}>
              สินค้าที่ใกล้เคียง
            </p>
          </div>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {relatedProducts.slice(0, 4).map((rp) => (
                <button
                  key={rp.id}
                  type="button"
                  onClick={() => navigate(`/product-detail?showcase_id=${rp.id}`)}
                  className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer text-left"
                >
                  <div className="relative h-[150px] shrink-0 bg-gray-100">
                    <ImageWithFallback src={rp.image} alt={rp.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                    <span
                      className="absolute top-2 left-2 z-[1] px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: BRAND.orange }}
                    >
                      สินค้า
                    </span>
                  </div>
                  <div className="p-3 flex flex-col flex-1 min-w-0">
                    <h3 className="text-xs font-bold leading-[18px] line-clamp-2 min-h-[36px]" style={{ color: BRAND.ink }}>
                      {rp.title}
                    </h3>
                    <p className="text-[10px] leading-[14px] text-gray-400 mt-1 line-clamp-2 min-h-[28px]">
                      {rp.excerpt || 'รายละเอียดสินค้า'}
                    </p>
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <div className="h-[18px] mb-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate" style={{ color: BRAND.ink }}>
                          {rp.factoryName}
                        </p>
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <span className="text-[10px] text-gray-400 shrink-0">
                          MOQ <span className="font-semibold tabular-nums" style={{ color: BRAND.ink }}>{rp.minOrder || '-'}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400">
                          <Heart className="w-3 h-3 shrink-0" />
                          <span className="tabular-nums">{rp.likes}</span>
                        </span>
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
      </>

      {/* ── Sticky bottom CTA bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex items-stretch h-[60px]"
        style={{ borderColor: BRAND.divider }}
      >
        <button
          type="button"
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="w-[72px] flex flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] leading-none">โปรไฟล์</span>
        </button>
        <div className="w-px bg-gray-100" />
        <button
          type="button"
          className="w-[72px] flex flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50"
          aria-label="ถูกใจ"
        >
          <Heart className="w-5 h-5" style={{ color: BRAND.orange }} />
          <span className="text-[10px] leading-none text-gray-500">{item.likes}</span>
        </button>
        <button
          type="button"
          onClick={canChat ? handleStartChat : () => navigate(`/factories/${item.factoryId}`)}
          disabled={starting}
          className="flex-1 flex items-center justify-center gap-2 text-white font-bold text-[14px] disabled:opacity-70"
          style={{ background: BRAND.orange }}
        >
          {starting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
        </button>
      </div>
    </div>
  );
}
