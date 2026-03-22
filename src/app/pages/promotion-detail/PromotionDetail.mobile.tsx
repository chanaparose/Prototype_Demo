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
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
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

export function PromotionDetailMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();

  const item = data.factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'promotion',
  );
  const factory = item ? data.factories.find((f) => f.id === item.factoryId) : null;
  const factoryConversation = item
    ? data.conversations.find((conversation) => conversation.factoryId === item.factoryId)
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
          ไม่พบข้อมูลโปรโมชัน
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 mb-2">
            โปรโมชัน
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
                {factory?.verified && <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />}
              </div>
              <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {factory?.location ?? '-'}
              </p>
            </div>
            <p className="text-xs text-gray-500">{formatThaiDate(item.postedAt)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
          <p className="text-xs text-amber-700 mb-1">ดีลพิเศษจากโรงงาน</p>
          <p className="text-sm text-gray-800" style={{ fontWeight: 700 }}>
            {item.excerpt}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>
            เงื่อนไขโปรโมชัน
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <CirclePercent className="w-4 h-4 mt-0.5 text-amber-600" />
              สำหรับคำสั่งซื้อใหม่ที่เริ่มผลิตภายในช่วงแคมเปญ
            </p>
            <p className="flex items-start gap-2">
              <CalendarClock className="w-4 h-4 mt-0.5 text-amber-600" />
              ระยะเวลาผลิตโดยเฉลี่ย {item.leadTime} (ขึ้นอยู่กับสเปกจริง)
            </p>
            <p className="flex items-start gap-2">
              <TicketPercent className="w-4 h-4 mt-0.5 text-amber-600" />
              ขั้นต่ำการสั่งผลิตที่ MOQ {item.minOrder}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            หมวดและแท็ก
          </p>
          <p className="text-xs text-gray-500 mb-2">หมวดหมู่: {item.category}</p>
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
            รายละเอียดที่จำเป็นก่อนรับโปรโมชัน
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
            <li>ช่วงเวลาที่ต้องการเริ่มผลิตและวันเปิดตัวสินค้า</li>
            <li>จำนวนผลิตที่คาดการณ์ในรอบแรกและรอบถัดไป</li>
            <li>รูปแบบแพ็กเกจหรือฉลากที่ต้องการให้รวมในโปรฯ</li>
            <li>เงื่อนไขการชำระเงินและเอกสารที่แบรนด์ต้องใช้</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

