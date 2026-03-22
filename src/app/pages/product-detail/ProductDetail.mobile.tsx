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
import { conversations, factories, factoryShowcases } from '../../data/mockData';
import { ImageWithFallback } from '../../components/shared';

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

  const item = factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'product',
  );
  const factory = item ? factories.find((f) => f.id === item.factoryId) : null;
  const factoryConversation = item
    ? conversations.find((conversation) => conversation.factoryId === item.factoryId)
    : null;

  if (!item) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
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
        <button
          type="button"
          onClick={() =>
            navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')
          }
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md"
          aria-label="แชทกับโรงงาน"
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#6C47FF' }} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/90 mb-2">
            สินค้า
          </span>
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
                {factory?.verified && (
                  <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            แท็กสินค้า
          </p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
  const navigate = useNavigate();
  const { id } = useParams();

  const item = factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'product',
  );
  const factory = item ? factories.find((f) => f.id === item.factoryId) : null;
  const factoryConversation = item
    ? conversations.find(
        (conversation) => conversation.factoryId === item.factoryId,
      )
    : null;

  if (!item) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
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
        <button
          type="button"
          onClick={() =>
            navigate(
              factoryConversation
                ? `/messages/${factoryConversation.id}`
                : '/messages',
            )
          }
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md"
          aria-label="แชทกับโรงงาน"
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#6C47FF' }} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/90 mb-2">
            สินค้า
          </span>
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
                <p
                  className="text-sm text-gray-900 truncate"
                  style={{ fontWeight: 700 }}
                >
                  {item.factoryName}
                </p>
                {factory?.verified && (
                  <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p
            className="text-sm text-gray-900 mb-2.5"
            style={{ fontWeight: 700 }}
          >
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            แท็กสินค้า
          </p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p
            className="text-sm text-gray-900 mb-2.5"
            style={{ fontWeight: 700 }}
          >
            ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
            <li>กลุ่มเป้าหมายและจุดขายหลักของสินค้า</li>
            <li>ขนาดบรรจุ/วัสดุ/รสชาติหรือสเปกที่ต้องการ</li>
            <li>งบประมาณต่อรอบผลิต และช่วงเวลาที่ต้องการเปิดขาย</li>
            <li>เอกสารที่ต้องใช้ เช่น อย., HALAL, หรือมาตรฐานเฉพาะแบรนด์</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Hero */}
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

        <button type="button" onClick={() => navigate('/factory-ideas')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <button type="button"
          onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-md text-[12px] font-bold text-violet-600">
          <MessageCircle className="w-4 h-4" /> แชท
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-[10px] font-bold text-white mb-2">
            <TicketPercent className="w-3 h-3" /> โปรโมชัน
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
        {/* Factory card */}
        <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
          className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-[0.99] transition-transform">
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

        {/* Deal highlight */}
        <div className="rounded-2xl p-4 border border-amber-100 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
              <TicketPercent className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[12px] font-bold text-amber-700">ดีลพิเศษจากโรงงาน</p>
          </div>
          <p className="text-[13px] font-semibold text-gray-800 leading-relaxed">{item.excerpt}</p>
        </div>

        {/* Promo info grid */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-gray-700 mb-3">ข้อมูลโปรโมชัน</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Tag className="w-3.5 h-3.5 text-amber-500" />,    label: 'หมวดหมู่',   value: item.category },
              { icon: <Package className="w-3.5 h-3.5 text-amber-500" />, label: 'MOQ',         value: item.minOrder },
              { icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,   label: 'Lead Time',   value: item.leadTime },
              { icon: <Heart className="w-3.5 h-3.5 text-gray-400" />,   label: 'ถูกใจ',       value: `${item.likes} คน` },
            ].map((r) => (
              <div key={r.label} className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">{r.icon}<span className="text-[10px] text-gray-400">{r.label}</span></div>
                <p className="text-[12px] font-bold text-gray-800">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[13px] font-bold text-gray-900 mb-3">เงื่อนไขโปรโมชัน</p>
          <div className="space-y-3">
            {[
              { icon: <CirclePercent className="w-4 h-4 text-amber-500" />, text: 'สำหรับคำสั่งซื้อใหม่ที่เริ่มผลิตภายในช่วงแคมเปญเท่านั้น' },
              { icon: <CalendarClock className="w-4 h-4 text-amber-500" />, text: `ระยะเวลาผลิตโดยเฉลี่ย ${item.leadTime} (ขึ้นอยู่กับสเปกจริง)` },
              { icon: <TicketPercent className="w-4 h-4 text-amber-500" />, text: `ขั้นต่ำการสั่งผลิตที่ MOQ ${item.minOrder}` },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">{s.icon}</div>
                <p className="text-[12px] text-gray-600 leading-relaxed pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-promo checklist */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[13px] font-bold text-gray-900 mb-3">รายละเอียดที่จำเป็นก่อนรับโปรโมชัน</p>
          <div className="space-y-2">
            {[
              'ช่วงเวลาที่ต้องการเริ่มผลิตและวันเปิดตัวสินค้า',
              'จำนวนผลิตที่คาดการณ์ในรอบแรกและรอบถัดไป',
              'รูปแบบแพ็กเกจหรือฉลากที่ต้องการให้รวมในโปรฯ',
              'เงื่อนไขการชำระเงินและเอกสารที่แบรนด์ต้องใช้',
            ].map((txt, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-relaxed">{txt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[12px] font-bold text-gray-700 mb-2.5">แท็กและหมวดหมู่</p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium border border-gray-200">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2 pt-1">
          <button type="button"
            onClick={() => navigate(factoryConversation ? `/messages/${factoryConversation.id}` : '/messages')}
            className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white shadow-md flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}>
            <MessageCircle className="w-4 h-4" /> แชทกับโรงงาน
          </button>
          <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold text-violet-600 border border-violet-200 bg-white">
            ดูโปรไฟล์โรงงาน
          </button>
        </div>
      </div>
    </div>
  );
}