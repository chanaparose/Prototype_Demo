import React from 'react';
import { useNavigate, useParams } from 'react-router';
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
  Star,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();

  const item = data.factoryShowcases.find((e) => e.id === id && e.contentType === 'idea');
  const factory = item ? data.factories.find((f) => f.id === item.factoryId) : null;

  if (!item) {
    return (
      <div className="px-4 pt-5 pb-20 bg-gray-50 min-h-screen">
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-3xl mb-2">💡</p>
          <p className="text-sm font-medium text-gray-500">ไม่พบข้อมูลไอเดีย</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Hero */}
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/90 text-[10px] font-bold text-white mb-2">
            <Lightbulb className="w-3 h-3" /> ไอเดีย
          </span>
          <h1 className="text-[17px] font-bold text-white leading-snug">{item.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-white/65 text-[10px]">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatThaiDate(item.postedAt)}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes}</span>
            <span>{item.category}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Concept */}
        <div className="rounded-2xl p-4 border border-violet-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <p className="text-[12px] font-bold text-violet-700">แนวคิดจากโรงงาน</p>
          </div>
          <p className="text-[13px] text-gray-700 leading-relaxed">{item.excerpt}</p>
        </div>

        {/* Factory card */}
        <button
          type="button"
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 shrink-0">
              <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-bold text-gray-900 truncate">{item.factoryName}</p>
                {factory?.verified && <BadgeCheck className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{factory?.location ?? '-'}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{factory?.rating}</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </button>

        {/* Production info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-gray-700 mb-3">ข้อมูลการผลิต</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Tag className="w-3.5 h-3.5 text-violet-500" />,    label: 'หมวดหมู่',        value: item.category },
              { icon: <Package className="w-3.5 h-3.5 text-violet-500" />, label: 'MOQ',              value: item.minOrder },
              { icon: <Clock className="w-3.5 h-3.5 text-violet-500" />,   label: 'Lead Time',        value: item.leadTime },
              { icon: <Heart className="w-3.5 h-3.5 text-gray-400" />,    label: 'ถูกใจ',            value: `${item.likes} คน` },
            ].map((r) => (
              <div key={r.label} className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">{r.icon}<span className="text-[10px] text-gray-400">{r.label}</span></div>
                <p className="text-[12px] font-bold text-gray-800">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to apply */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[13px] font-bold text-gray-900 mb-3">วิธีนำไอเดียไปต่อยอด</p>
          <div className="space-y-3">
            {[
              { icon: <ListChecks className="w-4 h-4 text-violet-500" />, text: 'สรุป Requirement สินค้าและงบประมาณก่อนเริ่มคุยโรงงาน' },
              { icon: <TrendingUp className="w-4 h-4 text-violet-500" />, text: 'ทดลองตลาดด้วย MOQ ที่เหมาะสม และวัดผลก่อนขยายล็อต' },
              { icon: <Lightbulb className="w-4 h-4 text-violet-500" />,  text: 'ปรับจุดขายและแพ็กเกจให้ตรงกลุ่มเป้าหมาย' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">{s.icon}</div>
                <p className="text-[12px] text-gray-600 leading-relaxed pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-gray-700 mb-2.5">แท็กที่เกี่ยวข้อง</p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium border border-gray-200">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}
        >
          ติดต่อโรงงานนี้
        </button>
      </div>
    </div>
  );
}