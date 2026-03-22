import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CirclePercent,
  MapPin,
  MessageCircle,
  Tag,
  TicketPercent,
  Star,
  Heart,
  CalendarDays,
  Package,
  Clock,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function ProductDetailDesktop() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();

  const item = data.factoryShowcases.find((e) => e.id === id && e.contentType === 'product');
  const factory = item ? data.factories.find((f) => f.id === item.factoryId) : null;
  const factoryConversation = item ? data.conversations.find((c) => c.factoryId === item.factoryId) : null;

  if (!item) {
    return (
      <div className="hidden lg:block px-8 pt-8 pb-20 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-600 hover:text-violet-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-[14px] text-slate-500 font-medium">ไม่พบข้อมูลสินค้า</p>
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

        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="absolute top-5 left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-[13px] font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        <button
          type="button"
          onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
          className="absolute top-5 right-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-violet-600 text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/90 backdrop-blur-sm text-[11px] font-bold text-white mb-3">
            <Package className="w-3 h-3" /> สินค้า
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

          {/* Product highlight */}
          <div className="rounded-2xl p-6 border border-blue-100 shadow-sm bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[13px] font-bold text-blue-700">รายละเอียดสินค้า</p>
            </div>
            <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{item.excerpt}</p>
          </div>

          {/* Why this product works */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">จุดเด่นที่เหมาะกับแบรนด์</h2>
            <div className="space-y-4">
              {[
                { icon: <Package className="w-5 h-5 text-violet-500" />, title: 'รองรับการเริ่มต้น', desc: 'เหมาะกับการทดลองตลาดและปรับสูตร/สเปกได้ตามกลุ่มลูกค้า' },
                { icon: <Clock className="w-5 h-5 text-violet-500" />, title: 'Lead time ชัดเจน', desc: `ระยะเวลาผลิตโดยเฉลี่ย ${item.leadTime} ช่วยวางแผนเปิดตัวได้ง่าย` },
                { icon: <Star className="w-5 h-5 text-violet-500" />, title: 'ยกระดับ Perceived Value', desc: 'เพิ่มความน่าเชื่อถือและมูลค่าแบรนด์ด้วยรายละเอียดและมาตรฐานที่ครบ' },
              ].map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{s.title}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What to tell factory */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                'กลุ่มเป้าหมายและจุดขายหลักของสินค้า',
                'ขนาดบรรจุ/วัสดุ/รสชาติหรือสเปกที่ต้องการ',
                'งบประมาณต่อรอบผลิต และช่วงเวลาที่ต้องการเปิดขาย',
                'เอกสารที่ต้องใช้ เช่น อย., HALAL, หรือมาตรฐานเฉพาะแบรนด์',
              ].map((txt, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-slate-600 leading-relaxed">{txt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[13px] font-bold text-slate-700">แท็กและหมวดหมู่</h2>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] text-slate-500 font-medium">{item.category}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-[12px] font-medium transition-colors cursor-pointer border border-slate-200 hover:border-amber-200">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-72 flex-shrink-0 space-y-4">

          {/* Factory card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">โรงงานที่โพสต์</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{item.factoryName}</p>
                  {factory?.verified && <BadgeCheck className="w-4 h-4 text-violet-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{factory?.specialization}</p>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{factory?.location ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span><span className="font-semibold">{factory?.rating}</span> ({factory?.reviews} รีวิว)</span>
              </div>
            </div>
            <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-violet-200 text-violet-600 text-[12px] font-semibold hover:bg-violet-50 transition-colors">
              ดูโปรไฟล์โรงงาน <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">ข้อมูลสินค้า</p>
            <div className="space-y-3">
              {[
                { icon: <Tag className="w-4 h-4 text-blue-600" />,    label: 'หมวดหมู่',        value: item.category },
                { icon: <Package className="w-4 h-4 text-blue-600" />, label: 'ขั้นต่ำการผลิต', value: `MOQ ${item.minOrder}` },
                { icon: <Clock className="w-4 h-4 text-blue-600" />,   label: 'ระยะเวลาผลิต',   value: item.leadTime },
                { icon: <Heart className="w-4 h-4 text-slate-400" />,   label: 'ความสนใจ',        value: `${item.likes} คน` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">{row.icon} {row.label}</div>
                  <span className="text-[12px] font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <button type="button"
              onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}>
              <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
            </button>
            <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
              className="w-full py-3 rounded-2xl text-[13px] font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors">
              ดูโปรไฟล์เพิ่มเติม
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}