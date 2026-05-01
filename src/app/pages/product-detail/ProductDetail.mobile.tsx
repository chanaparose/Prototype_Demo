import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  PackageCheck,
  Tag,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useFactoryReviewSummary } from '../../hooks/useFactoryReviewSummary';
import { useFactoryReviewList } from '../../hooks/useFactoryReviewList';
import { ImageWithFallback } from '../../components/shared';
import { SubCategoryTag } from '../../components/SubCategoryTag';
import { getSectionsByType, getIcon, interpolate } from '../../utils/showcaseSections';

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const item = data.factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'product',
  );
  const factory = item ? data.factories.find((f) => f.id === item.factoryId) : null;
  const reviewSummaryQ = useFactoryReviewSummary(item?.factoryId ?? null);
  const reviewListQ = useFactoryReviewList(item?.factoryId ?? null);

  const subName = item?.sub_category_name?.trim();
  const isSelfFactory = String(user?.id ?? '') === String(item?.factoryId ?? '');
  const canChat = Boolean(item) && !isSelfFactory && String(item?.factoryId ?? '').trim() !== '';
  const summary = reviewSummaryQ.data;
  const avgRating = Number(summary?.average_rating ?? factory?.rating ?? 0);
  const reviewCount = Number(summary?.review_count ?? factory?.reviews ?? 0);
  const latestReviews = reviewListQ.data ?? [];

  if (!item) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm"
          style={{ color: '#7A4B94' }}
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบข้อมูลสินค้า
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        {canChat ? (
          <button
            type="button"
            onClick={() => {
              const sid = Number(id ?? item.id ?? 0);
              if (!Number.isFinite(sid) || sid <= 0) return;
              void startChat(item.factoryId, {
                type: 'PD',
                id: sid,
                title: item.title,
              });
            }}
            disabled={starting}
            className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md disabled:opacity-70"
            aria-label="แชทกับโรงงาน"
          >
            {starting ? (
              <span className="w-4 h-4 border-2 border-[#7A4B94] border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5" style={{ color: '#7A4B94' }} />
            )}
          </button>
        ) : null}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span
              className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(227,136,68,0.90)' }}
            >
              สินค้า
            </span>
            {item.category ? (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/35">
                หมวด: {item.category}
              </span>
            ) : null}
            {subName ? (
              <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 text-[10px] font-semibold px-2 py-0.5">
                sub: {subName}
              </span>
            ) : null}
          </div>
          <h1 className="text-lg leading-snug" style={{ fontWeight: 700 }}>
            {item.title}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Factory row */}
        <div
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm truncate" style={{ fontWeight: 700, color: '#2E2252' }}>
                  {item.factoryName}
                </p>
                {factory?.verified && (
                  <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#7A4B94' }} />
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {factory?.location ?? '-'}
                </span>
                <span>•</span>
                <span>เรต {factory?.rating ?? '-'}</span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>เผยแพร่</p>
              <p style={{ fontWeight: 600 }}>{formatThaiDate(item.postedAt)}</p>
            </div>
          </div>
        </div>

        {/* Product detail */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
            รายละเอียดสินค้า
          </p>
          <p className="text-sm text-gray-600">{item.excerpt}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl p-2.5" style={{ background: '#F8F6FA' }}>
              <p className="text-gray-400">หมวดหมู่</p>
              <p className="mt-0.5" style={{ color: '#2E2252', fontWeight: 600 }}>{item.category}</p>
            </div>
            {subName ? (
              <div className="rounded-xl p-2.5" style={{ background: '#F8F6FA' }}>
                <p className="text-gray-400">ประเภทย่อย</p>
                <p className="mt-0.5" style={{ color: '#2E2252', fontWeight: 600 }}>{subName}</p>
              </div>
            ) : null}
            <div className="rounded-xl p-2.5" style={{ background: '#F8F6FA' }}>
              <p className="text-gray-400">ขั้นต่ำการผลิต</p>
              <p className="mt-0.5" style={{ color: '#2E2252', fontWeight: 600 }}>MOQ {item.minOrder}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: '#F8F6FA' }}>
              <p className="text-gray-400">ระยะเวลาผลิต</p>
              <p className="mt-0.5" style={{ color: '#2E2252', fontWeight: 600 }}>{item.leadTime}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: '#FFF4E8' }}>
              <p className="text-gray-400">ความสนใจ</p>
              <p className="mt-0.5 inline-flex items-center gap-1" style={{ color: '#E38844', fontWeight: 600 }}>
                <Heart className="w-3 h-3" /> {item.likes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[13px] font-bold mb-2" style={{ color: '#2E2252' }}>คะแนนรีวิว</p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[28px] leading-none font-bold" style={{ color: '#E38844' }}>{avgRating.toFixed(1)}</p>
              <p className="text-[11px] text-gray-500 mt-1">{reviewCount} รีวิว</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Number(summary?.rating_breakdown?.[String(star)] ?? 0);
                const intensity =
                  reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] text-gray-500">{star}★</span>
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${intensity}%`, background: '#E38844' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
            <p className="text-[12px] font-semibold" style={{ color: '#2E2252' }}>รีวิวล่าสุดจากลูกค้า</p>
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

        {/* Highlight sections (from DB or fallback) */}
        {(() => {
          const highlightSections = getSectionsByType(item.sections, 'highlight');
          if (highlightSections.length > 0) {
            return highlightSections.map((sec) => (
              <div key={sec.section_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>{sec.section_title}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  {sec.items.sort((a, b) => a.sort_order - b.sort_order).map((si) => {
                    const Icon = getIcon(si.icon_name) ?? PackageCheck;
                    return (
                      <p key={si.item_id} className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />
                        {interpolate(si.description, item)}
                      </p>
                    );
                  })}
                </div>
              </div>
            ));
          }
          return (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>จุดเด่นที่เหมาะกับแบรนด์</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2"><PackageCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />รองรับ OEM/Private Label สำหรับผู้เริ่มต้นและแบรนด์ที่ต้องการขยายไลน์</p>
                <p className="flex items-start gap-2"><Clock3 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#E38844' }} />กำหนด timeline ผลิตชัดเจน ช่วยวางแผนเปิดตัวสินค้าได้ง่าย</p>
                <p className="flex items-start gap-2"><Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />มีโรงงานที่เชี่ยวชาญเฉพาะด้าน พร้อมทีมให้คำแนะนำก่อนเริ่มผลิต</p>
              </div>
            </div>
          );
        })()}

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
              แท็กสินค้า
            </p>
            {subName ? <SubCategoryTag name={subName} variant="outline" size="sm" /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(122,75,148,0.10)',
                  color: '#7A4B94',
                  border: '1px solid rgba(122,75,148,0.20)',
                }}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Checklist sections (from DB or fallback) */}
        {(() => {
          const checklistSections = getSectionsByType(item.sections, 'checklist');
          if (checklistSections.length > 0) {
            return checklistSections.map((sec) => (
              <div key={sec.section_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>{sec.section_title}</p>
                <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
                  {sec.items.sort((a, b) => a.sort_order - b.sort_order).map((si) => (
                    <li key={si.item_id}>{interpolate(si.description, item)}</li>
                  ))}
                </ul>
              </div>
            ));
          }
          return (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต</p>
              <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
                <li>กลุ่มเป้าหมายและจุดขายหลักของสินค้า</li>
                <li>ขนาดบรรจุ/วัสดุ/รสชาติหรือสเปกที่ต้องการ</li>
                <li>งบประมาณต่อรอบผลิต และช่วงเวลาที่ต้องการเปิดขาย</li>
                <li>เอกสารที่ต้องใช้ เช่น อย., HALAL, หรือมาตรฐานเฉพาะแบรนด์</li>
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
