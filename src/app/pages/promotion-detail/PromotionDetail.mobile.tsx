import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CirclePercent,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Tag,
  TicketPercent,
  Heart,
  CalendarDays,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { SubCategoryTag } from '../../components/SubCategoryTag';
import { usePromotionDetailShowcase } from '../../hooks/useShowcaseDetailPage';
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


export function PromotionDetailMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId } = usePromotionDetailShowcase();

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
          className="mb-4 inline-flex items-center gap-1 text-sm"
          style={{ color: '#7A4B94' }}
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
          {error || 'ไม่พบข้อมูลโปรโมชัน'}
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim();
  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
            onClick={() =>
              void startChat(item.factoryId, {
                type: 'PM',
                id: Number(resolvedId),
                title: item.title,
              })
            }
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
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(227,136,68,0.90)' }}
            >
              โปรโมชัน
            </span>
          </div>
          <h1 className="text-lg leading-snug" style={{ fontWeight: 700 }}>
            {item.title}
          </h1>
          <div className="mt-1 text-[11px] text-white/85 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> เผยแพร่ {formatThaiDate(item.postedAt)}
          </div>
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

        {/* Deal highlight */}
         

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[12px] font-semibold mb-2" style={{ color: '#9D77B2' }}>เวลาโปรโมชั่น</p>
          <div className="flex items-center gap-2 text-[13px] text-gray-700">
            <CalendarClock className="w-4 h-4 text-[#E38844]" />
            {item.startDate && item.endDate
              ? `${formatThaiDate(item.startDate)} - ${formatThaiDate(item.endDate)}`
              : 'ยังไม่ระบุช่วงเวลาโปรโมชั่น'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
            รายละเอียดโปรโมชัน
          </p>
          <MarkdownBody
            source={markdown}
            className="max-w-none !text-sm md:!text-sm text-gray-700 leading-relaxed"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p
            className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3"
            style={{ color: '#9D77B2' }}
          >
            ข้อมูลโปรโมชัน
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
              {
                icon: <CalendarClock className="w-4 h-4" style={{ color: '#E38844' }} />,
                label: 'ช่วงเวลาโปร',
                value: item.startDate && item.endDate ? `${formatThaiDate(item.startDate)} - ${formatThaiDate(item.endDate)}` : '-',
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 text-[12px] text-gray-500">{row.icon} {row.label}</div>
                <span className="text-[12px] font-semibold" style={{ color: '#2E2252' }}>{row.value}</span>
              </div>
            ))}
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
                    const Icon = getIcon(si.icon_name) ?? CirclePercent;
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
          
        })()}

        {/* Tags */}
         

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
              <h2 className="text-[15px] font-bold mb-3" style={{ color: '#2E2252' }}>
                รายละเอียดที่จำเป็นก่อนรับโปรโมชัน
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'ช่วงเวลาที่ต้องการเริ่มผลิตและวันเปิดตัวสินค้า',
                  'จำนวนผลิตที่คาดการณ์ในรอบแรกและรอบถัดไป',
                  'รูปแบบแพ็กเกจหรือฉลากที่ต้องการให้รวมในโปรฯ',
                  'เงื่อนไขการชำระเงินและเอกสารที่แบรนด์ต้องใช้',
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
