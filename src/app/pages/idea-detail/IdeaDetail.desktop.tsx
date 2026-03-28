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
  CheckCircle2,
  MessageCircle,
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
  const factoryConversation = item ? data.conversations.find((c) => c.factoryId === item.factoryId) : null;

  if (!item) {
    return (
      <div className="hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)]" style={{ background: '#F8F6FA' }}>
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: '#7A4B94' }}>
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-[14px] text-gray-500 font-medium">ไม่พบข้อมูลไอเดีย</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block min-h-[calc(100vh-4rem)]" style={{ background: '#F8F6FA' }}>
      {/* ── Hero banner ── */}
      <div className="relative h-72 overflow-hidden bg-gray-200">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="absolute top-5 left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        <button
          type="button"
          onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
          className="absolute top-5 right-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
          style={{ color: '#7A4B94' }}
        >
          <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm text-[11px] font-bold text-white mb-3"
            style={{ background: 'rgba(122,75,148,0.90)' }}
          >
            <Lightbulb className="w-3 h-3" /> ไอเดีย
          </span>
          <h1 className="text-[26px] font-bold text-white leading-snug max-w-3xl">{item.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-white/70 text-[12px]">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> เผยแพร่ {formatThaiDate(item.postedAt)}</span>
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {item.likes} ถูกใจ</span>
            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {item.category}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-8 py-7 flex gap-7">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Concept highlight */}
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: '#F8F6FA', border: '1px solid rgba(122,75,148,0.20)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(122,75,148,0.15)' }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: '#7A4B94' }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: '#7A4B94' }}>แนวคิดจากโรงงาน</p>
            </div>
            <p className="text-[14px] font-medium text-gray-700 leading-relaxed">{item.excerpt}</p>
          </div>

          {/* How to apply */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold mb-4" style={{ color: '#2E2252' }}>วิธีนำไอเดียไปต่อยอด</h2>
            <div className="space-y-4">
              {[
                {
                  icon: <ListChecks className="w-5 h-5" style={{ color: '#7A4B94' }} />,
                  title: 'วางแผน Requirement',
                  desc: 'สรุปสเปกสินค้า วัตถุดิบ และงบประมาณที่ต้องการก่อนเริ่มคุยกับโรงงาน เพื่อให้ได้ราคาที่แม่นยำ',
                },
                {
                  icon: <TrendingUp className="w-5 h-5" style={{ color: '#E38844' }} />,
                  title: 'ทดสอบตลาดด้วย MOQ เล็ก',
                  desc: 'เริ่มจากล็อตเล็กเพื่อวัดตลาด ก่อนขยาย production เพื่อลดความเสี่ยงในการถือสต็อก',
                },
                {
                  icon: <Lightbulb className="w-5 h-5" style={{ color: '#7A4B94' }} />,
                  title: 'ปรับ Positioning และแพ็กเกจ',
                  desc: 'ออกแบบแพ็กเกจและจุดขายให้ตรงกลุ่มเป้าหมายเพื่อเพิ่มอัตราการซื้อซ้ำและ margin',
                },
              ].map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#F8F6FA', border: '1px solid rgba(122,75,148,0.15)' }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: '#2E2252' }}>{s.title}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-production checklist */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold mb-4" style={{ color: '#2E2252' }}>สิ่งที่ควรเตรียมก่อนเริ่มผลิต</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                'กลุ่มเป้าหมายและจุดขายหลักของสินค้า',
                'ขนาดบรรจุ / วัสดุ / สเปกที่ต้องการ',
                'งบประมาณต่อรอบผลิตและเวลาเปิดตัว',
                'เอกสารที่ต้องใช้ เช่น อย., HALAL',
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

          {/* Tags */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[13px] font-bold" style={{ color: '#2E2252' }}>แท็กที่เกี่ยวข้อง</h2>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(122,75,148,0.10)', color: '#7A4B94' }}
              >{item.category}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(122,75,148,0.08)',
                    color: '#7A4B94',
                    border: '1px solid rgba(122,75,148,0.20)',
                  }}
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-72 flex-shrink-0 space-y-4">

          {/* Factory card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p
              className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3"
              style={{ color: '#9D77B2' }}
            >โรงงานที่โพสต์</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold truncate" style={{ color: '#2E2252' }}>{item.factoryName}</p>
                  {factory?.verified && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#7A4B94' }} />}
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{factory?.specialization}</p>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{factory?.location ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 fill-amber-400" style={{ color: '#E38844' }} />
                <span><span className="font-semibold">{factory?.rating}</span> ({factory?.reviews} รีวิว)</span>
              </div>
            </div>
            <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
              style={{
                border: '1px solid rgba(122,75,148,0.30)',
                color: '#7A4B94',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(122,75,148,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ดูโปรไฟล์โรงงาน <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Production info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p
              className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3"
              style={{ color: '#9D77B2' }}
            >ข้อมูลการผลิต</p>
            <div className="space-y-3">
              {[
                { icon: <Tag className="w-4 h-4" style={{ color: '#7A4B94' }} />,     label: 'หมวดหมู่',        value: item.category },
                { icon: <Package className="w-4 h-4" style={{ color: '#7A4B94' }} />,  label: 'ขั้นต่ำการผลิต', value: `MOQ ${item.minOrder}` },
                { icon: <Clock className="w-4 h-4" style={{ color: '#E38844' }} />,    label: 'ระยะเวลาผลิต',   value: item.leadTime },
                { icon: <Heart className="w-4 h-4" style={{ color: '#E38844' }} />,    label: 'ความสนใจ',        value: `${item.likes} คน` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">{row.icon} {row.label}</div>
                  <span className="text-[12px] font-semibold" style={{ color: '#2E2252' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <button type="button"
              onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2D1B4E, #4A267D)' }}>
              <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
            </button>
            <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
              className="w-full py-3 rounded-2xl text-[13px] font-semibold transition-colors"
              style={{
                color: '#7A4B94',
                border: '1px solid rgba(122,75,148,0.30)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(122,75,148,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ดูโปรไฟล์เพิ่มเติม
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
