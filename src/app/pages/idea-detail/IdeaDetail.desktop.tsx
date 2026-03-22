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
  Star,
  Heart,
  CalendarDays,
  Package,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function IdeaDetailDesktop() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();

  const item = data.factoryShowcases.find((e) => e.id === id && e.contentType === 'idea');
  const factory = item ? data.factories.find((f) => f.id === item.factoryId) : null;

  if (!item) {
    return (
      <div className="hidden lg:block px-8 pt-8 pb-20 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-600 hover:text-violet-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-[14px] text-slate-500 font-medium">ไม่พบข้อมูลไอเดีย</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* ── Hero banner ── */}
      <div className="relative h-72 overflow-hidden bg-slate-200">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back */}
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="absolute top-5 left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/90 backdrop-blur-sm text-[11px] font-bold text-white mb-3">
            <Lightbulb className="w-3 h-3" /> ไอเดีย
          </span>
          <h1 className="text-[26px] font-bold text-white leading-snug max-w-3xl">{item.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-white/70 text-[12px]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {formatThaiDate(item.postedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> {item.likes} ถูกใจ
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> {item.category}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-8 py-7 flex gap-7">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Excerpt / concept */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-[13px] font-bold text-violet-700">แนวคิดจากโรงงาน</p>
            </div>
            <p className="text-[14px] text-slate-700 leading-relaxed">{item.excerpt}</p>
          </div>

          {/* How to apply */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">วิธีนำไอเดียไปต่อยอด</h2>
            <div className="space-y-4">
              {[
                { icon: <ListChecks className="w-5 h-5 text-violet-500" />, title: 'วางแผน Requirement', desc: 'สรุปสเปกสินค้า วัตถุดิบ และงบประมาณที่ต้องการก่อนเริ่มคุยกับโรงงาน เพื่อให้ได้ราคาที่แม่นยำ' },
                { icon: <TrendingUp className="w-5 h-5 text-violet-500" />, title: 'ทดสอบตลาดด้วย MOQ เล็ก', desc: 'เริ่มจากล็อตเล็กเพื่อวัดตลาด ก่อนขยาย production เพื่อลดความเสี่ยงในการถือสต็อก' },
                { icon: <Lightbulb className="w-5 h-5 text-violet-500" />, title: 'ปรับ Positioning และแพ็กเกจ', desc: 'ออกแบบแพ็กเกจและจุดขายให้ตรงกลุ่มเป้าหมายเพื่อเพิ่มอัตราการซื้อซ้ำและ margin' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{step.title}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-production checklist */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">สิ่งที่ควรเตรียมก่อนเริ่มผลิต</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                'กลุ่มเป้าหมายและจุดขายหลักของสินค้า',
                'ขนาดบรรจุ / วัสดุ / สเปกที่ต้องการ',
                'งบประมาณต่อรอบผลิตและเวลาเปิดตัว',
                'เอกสารที่ต้องใช้ เช่น อย., HALAL',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                  <p className="text-[12px] text-slate-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h2 className="text-[13px] font-bold text-slate-700 mb-3">แท็กที่เกี่ยวข้อง</h2>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-[12px] font-medium transition-colors cursor-pointer border border-slate-200 hover:border-violet-200">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-72 flex-shrink-0 space-y-4">

          {/* Factory card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5">
              <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">โรงงานที่โพสต์</p>
              <button
                type="button"
                onClick={() => navigate(`/factories/${item.factoryId}`)}
                className="group w-full text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                    <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors">{item.factoryName}</p>
                      {factory?.verified && <BadgeCheck className="w-4 h-4 text-violet-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{factory?.specialization}</p>
                  </div>
                </div>
              </button>

              <div className="space-y-2 text-[12px] text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{factory?.location ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span><span className="font-semibold">{factory?.rating}</span> ({factory?.reviews} รีวิว)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/factories/${item.factoryId}`)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-violet-200 text-violet-600 text-[12px] font-semibold hover:bg-violet-50 transition-colors"
              >
                ดูโปรไฟล์โรงงาน <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Production info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">ข้อมูลการผลิต</p>
            <div className="space-y-3">
              {[
                { icon: <Package className="w-4 h-4 text-violet-500" />, label: 'หมวดหมู่', value: item.category },
                { icon: <Package className="w-4 h-4 text-violet-500" />, label: 'ขั้นต่ำการผลิต', value: `MOQ ${item.minOrder}` },
                { icon: <Clock className="w-4 h-4 text-violet-500" />,   label: 'ระยะเวลาผลิต', value: item.leadTime },
                { icon: <Heart className="w-4 h-4 text-slate-400" />,    label: 'ความสนใจ', value: `${item.likes} คน` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    {row.icon} {row.label}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate(`/factories/${item.factoryId}`)}
            className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}
          >
            ติดต่อโรงงานนี้
          </button>
        </aside>
      </div>
    </div>
  );
}