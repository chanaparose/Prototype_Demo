import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Lightbulb,
  ListChecks,
  MapPin,
  Tag,
  TrendingUp,
  CalendarDays,
  Heart,
  Package,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { useIdeaDetailShowcase } from '../../hooks/useShowcaseDetailPage';

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { item, loading, factory, factoryConversation, resolvedId } = useIdeaDetailShowcase();

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
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบข้อมูลไอเดีย
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md"
          aria-label="แชทกับโรงงาน"
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#7A4B94' }} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2"
            style={{ background: 'rgba(122,75,148,0.90)' }}
          >
            <Lightbulb className="w-3 h-3" /> ไอเดีย
          </span>
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

        {/* Concept highlight */}
        <div
          className="rounded-2xl p-4 shadow-sm"
          style={{ background: '#F8F6FA', border: '1px solid rgba(122,75,148,0.20)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(122,75,148,0.15)' }}
            >
              <Lightbulb className="w-3.5 h-3.5" style={{ color: '#7A4B94' }} />
            </div>
            <p className="text-[12px] font-bold" style={{ color: '#7A4B94' }}>แนวคิดจากโรงงาน</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{item.excerpt}</p>
        </div>

        {/* Stats grid */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
            ข้อมูลการผลิต
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl p-2.5" style={{ background: '#F8F6FA' }}>
              <p className="text-gray-400">หมวดหมู่</p>
              <p className="mt-0.5" style={{ color: '#2E2252', fontWeight: 600 }}>{item.category}</p>
            </div>
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

        {/* How to apply */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>
            วิธีนำไอเดียไปต่อยอด
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <ListChecks className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />
              สรุป Requirement สินค้าและงบประมาณก่อนเริ่มคุยโรงงาน
            </p>
            <p className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#E38844' }} />
              ทดลองตลาดด้วย MOQ ที่เหมาะสม และวัดผลก่อนขยายล็อต
            </p>
            <p className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />
              ปรับจุดขายและแพ็กเกจให้ตรงกลุ่มเป้าหมาย
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2" style={{ fontWeight: 700, color: '#2E2252' }}>
            แท็กที่เกี่ยวข้อง
          </p>
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

        {/* Pre-production checklist */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>
            สิ่งที่ควรเตรียมก่อนเริ่มผลิต
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
            <li>กลุ่มเป้าหมายและจุดขายหลักของสินค้า</li>
            <li>ขนาดบรรจุ / วัสดุ / สเปกที่ต้องการ</li>
            <li>งบประมาณต่อรอบผลิตและเวลาเปิดตัว</li>
            <li>เอกสารที่ต้องใช้ เช่น อย., HALAL</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
