import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
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
import { ImageWithFallback } from '../../components/shared';
import { SubCategoryTag } from '../../components/SubCategoryTag';
import { useProductDetailShowcase } from '../../hooks/useProductDetailShowcase';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, isIdea, resolvedId } = useProductDetailShowcase();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8">
        <span
          className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {error ? error : 'ไม่พบข้อมูลสินค้า'}
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim();
  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PD',
      id: String(resolvedId),
      title: item.title,
    });

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        {canChat ? (
          <button
            type="button"
            onClick={handleStartChat}
            disabled={starting}
            className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md disabled:opacity-70"
            aria-label="แชทกับโรงงาน"
          >
            {starting ? (
              <span className="w-4 h-4 border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5" style={{ color: '#6C47FF' }} />
            )}
          </button>
        ) : null}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="inline-flex rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold">
              {isIdea ? 'ไอเดีย / บทความ' : 'สินค้า'}
            </span>
            {!isIdea && item.category ? (
              <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-2 py-0.5 text-[10px] font-bold text-white">
                {item.category}
              </span>
            ) : null}
            {!isIdea && subName ? (
              <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 text-white text-[10px] font-semibold px-2 py-0.5">
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
        <div
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
                  {item.factoryName}
                </p>
                {factory?.verified && <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />}
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
            รายละเอียดสินค้า
          </p>
          <p className="text-sm text-gray-600">{item.excerpt}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">หมวดหมู่</p>
              <p className="text-gray-700 mt-0.5">{item.category}</p>
            </div>
            {subName ? (
              <div className="rounded-xl bg-violet-50 p-2.5">
                <p className="text-violet-400">ประเภทย่อย</p>
                <p className="text-violet-700 mt-0.5 font-medium">{subName}</p>
              </div>
            ) : null}
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">ขั้นต่ำการผลิต</p>
              <p className="text-gray-700 mt-0.5">MOQ {item.minOrder}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">ระยะเวลาผลิต</p>
              <p className="text-gray-700 mt-0.5">{item.leadTime}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">ความสนใจ</p>
              <p className="text-gray-700 mt-0.5 inline-flex items-center gap-1">
                <Heart className="w-3 h-3" /> {item.likes}
              </p>
            </div>
          </div>
        </div>

        {(() => {
          const highlightSections = getSectionsByType(item.sections, 'highlight');
          if (highlightSections.length > 0) {
            return highlightSections.map((sec) => (
              <div key={sec.section_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-900 mb-2.5" style={{ fontWeight: 700 }}>{sec.section_title}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  {sec.items.sort((a, b) => a.sort_order - b.sort_order).map((si) => {
                    const Icon = getIcon(si.icon_name);
                    return (
                      <p key={si.item_id} className="flex items-start gap-2">
                        {Icon ? (
                          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-purple-600" />
                        ) : (
                          <PackageCheck className="w-4 h-4 mt-0.5 shrink-0 text-purple-600" />
                        )}
                        <span>
                          {si.title ? <span className="font-semibold text-gray-800 block">{interpolate(si.title, item)}</span> : null}
                          <span className="text-gray-600">{interpolate(si.description, item)}</span>
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
            ));
          }
          return (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-900 mb-2.5" style={{ fontWeight: 700 }}>
                จุดเด่นที่เหมาะกับแบรนด์
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <PackageCheck className="w-4 h-4 mt-0.5 text-purple-600" />
                  รองรับ OEM/Private Label สำหรับผู้เริ่มต้นและแบรนด์ที่ต้องการขยายไลน์
                </p>
                <p className="flex items-start gap-2">
                  <Clock3 className="w-4 h-4 mt-0.5 text-purple-600" />
                  กำหนด timeline ผลิตชัดเจน ช่วยวางแผนเปิดตัวสินค้าได้ง่าย
                </p>
                <p className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 text-purple-600" />
                  มีโรงงานที่เชี่ยวชาญเฉพาะด้าน พร้อมทีมให้คำแนะนำก่อนเริ่มผลิต
                </p>
              </div>
            </div>
          );
        })()}

        {(() => {
          const checklistSections = getSectionsByType(item.sections, 'checklist');
          if (checklistSections.length > 0) {
            return checklistSections.map((sec) => (
              <div key={sec.section_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-900 mb-2.5" style={{ fontWeight: 700 }}>{sec.section_title}</p>
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
              <p className="text-sm text-gray-900 mb-2.5" style={{ fontWeight: 700 }}>
                ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต
              </p>
              <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
                <li>กลุ่มเป้าหมายและจุดขายหลักของสินค้า</li>
                <li>ขนาดบรรจุ/วัสดุ/รสชาติหรือสเปกที่ต้องการ</li>
                <li>งบประมาณต่อรอบผลิต และช่วงเวลาที่ต้องการเปิดขาย</li>
                <li>เอกสารที่ต้องใช้ เช่น อย., HALAL, หรือมาตรฐานเฉพาะแบรนด์</li>
              </ul>
            </div>
          );
        })()}

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
              แท็กและหมวดหมู่
            </p>
            {item.category ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(227,136,68,0.12)', color: '#E38844' }}
              >{item.category}</span>
            ) : null}
            {subName ? <SubCategoryTag name={subName} variant="outline" size="sm" /> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {item.tags.length > 0 ? (
              item.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">ยังไม่มีแท็กสินค้า</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
