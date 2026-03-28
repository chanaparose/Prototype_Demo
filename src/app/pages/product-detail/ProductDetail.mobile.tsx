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

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useData();

  const item = data.factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'product',
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
          className="mb-4 inline-flex items-center gap-1 text-sm"
          style={{ color: '#7A4B94' }}
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
          <MessageCircle className="w-5 h-5" style={{ color: '#7A4B94' }} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span
            className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2"
            style={{ background: 'rgba(227,136,68,0.90)' }}
          >
            สินค้า
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

        {/* Product detail */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
            รายละเอียดสินค้า
          </p>
          <p className="text-sm text-gray-600">{item.excerpt}</p>
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

        {/* Highlights */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>
            จุดเด่นที่เหมาะกับแบรนด์
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <PackageCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />
              รองรับ OEM/Private Label สำหรับผู้เริ่มต้นและแบรนด์ที่ต้องการขยายไลน์
            </p>
            <p className="flex items-start gap-2">
              <Clock3 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#E38844' }} />
              กำหนด timeline ผลิตชัดเจน ช่วยวางแผนเปิดตัวสินค้าได้ง่าย
            </p>
            <p className="flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7A4B94' }} />
              มีโรงงานที่เชี่ยวชาญเฉพาะด้าน พร้อมทีมให้คำแนะนำก่อนเริ่มผลิต
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2" style={{ fontWeight: 700, color: '#2E2252' }}>
            แท็กสินค้า
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

        {/* Info before factory */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm mb-2.5" style={{ fontWeight: 700, color: '#2E2252' }}>
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
