import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Tag,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { SubCategoryTag } from '../../components/SubCategoryTag';
import { useProductDetailShowcase } from '../../hooks/useProductDetailShowcase';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';
import { getSectionsByType, getIcon, interpolate } from '../../utils/showcaseSections';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';

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

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, isIdea, resolvedId } = useProductDetailShowcase();
  const gallery = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls) ? item.imageUrls.filter((u) => String(u).trim() !== '') : [];
    if (urls.length > 0) return urls.slice(0, 5);
    return item?.image ? [item.image] : [];
  }, [item?.image, item?.imageUrls]);

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
      id: Number(resolvedId),
      title: item.title,
    });
  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback src={gallery[0] ?? item.image} alt={item.title} className="w-full h-full object-cover" />
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
        {gallery.length > 1 ? (
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-5 gap-2">
              {gallery.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
 
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
          <MarkdownBody source={markdown} className="max-w-none !text-sm md:!text-sm text-gray-700 leading-relaxed" />
          
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p
              className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3"
              style={{ color: '#9D77B2' }}
            >
              ข้อมูลสินค้า
            </p>
            <div className="space-y-2">
              {[
                { icon: <Tag className="w-4 h-4" style={{ color: '#7A4B94' }} />, label: 'หมวดหมู่', value: item.category },
                ...(subName
                  ? [{ icon: <Tag className="w-4 h-4" style={{ color: '#7A4B94' }} />, label: 'ประเภทย่อย', value: subName }]
                  : []),
                { icon: <Package className="w-4 h-4" style={{ color: '#7A4B94' }} />, label: 'ขั้นต่ำการผลิต', value: `MOQ ${item.minOrder}` },
                { icon: <Clock className="w-4 h-4" style={{ color: '#E38844' }} />, label: 'ระยะเวลาผลิต', value: item.leadTime },
                { icon: <Heart className="w-4 h-4" style={{ color: '#E38844' }} />, label: 'ความสนใจ', value: `${item.likes} คน` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">{row.icon} {row.label}</div>
                  <span className="text-[12px] font-semibold" style={{ color: '#2E2252' }}>{row.value}</span>
                </div>
              ))}
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
              <h2 className="text-[15px] font-bold mb-3" style={{ color: '#2E2252' }}>
                ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'กลุ่มเป้าหมายและจุดขายหลักของสินค้า',
                  'ขนาดบรรจุ/วัสดุ/รสชาติหรือสเปกที่ต้องการ',
                  'งบประมาณต่อรอบผลิต และช่วงเวลาที่ต้องการเปิดขาย',
                  'เอกสารที่ต้องใช้ เช่น อย., HALAL, หรือมาตรฐานเฉพาะแบรนด์',
                ].map((txt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: '#F8F6FA', border: '1px solid rgba(122,75,148,0.12)' }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#7A4B94' }} />
                    <p className="text-[12px] text-gray-600 leading-relaxed">{txt}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        
      </div>
    </div>
  );
}
