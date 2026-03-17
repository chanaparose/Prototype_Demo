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
} from 'lucide-react';
import { factories, factoryShowcases } from '../../data/mockData';
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

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const item = factoryShowcases.find(
    (entry) => entry.id === id && entry.contentType === 'idea',
  );
  const factory = item ? factories.find((f) => f.id === item.factoryId) : null;

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
          ไม่พบข้อมูลไอเดีย
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="relative h-56">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/90 mb-2">
            ไอเดีย
          </span>
          <h1 className="text-lg leading-snug" style={{ fontWeight: 700 }}>
            {item.title}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
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
              <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {factory?.location ?? '-'}
              </p>
            </div>
            <p className="text-xs text-gray-500">{formatThaiDate(item.postedAt)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100 shadow-sm">
          <p className="text-xs text-violet-700 mb-1 inline-flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> แนวคิดจากโรงงาน
          </p>
          <p className="text-sm text-gray-700">{item.excerpt}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>
            วิธีนำไอเดียไปต่อยอด
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <ListChecks className="w-4 h-4 mt-0.5 text-purple-600" />
              สรุป Requirement สินค้าและงบประมาณที่ต้องการก่อนเริ่มคุยโรงงาน
            </p>
            <p className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 mt-0.5 text-purple-600" />
              ทดลองตลาดด้วย MOQ ที่เหมาะสม และวัดผลตอบรับก่อนขยายล็อต
            </p>
            <p className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 text-purple-600" />
              ปรับจุดขายและแพ็กเกจให้ตรงกลุ่มเป้าหมายเพื่อเพิ่มอัตราการซื้อซ้ำ
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            ข้อมูลผลิตเบื้องต้น
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">หมวดหมู่</p>
              <p className="text-gray-700 mt-0.5">{item.category}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-gray-400">ขั้นต่ำการผลิต</p>
              <p className="text-gray-700 mt-0.5">MOQ {item.minOrder}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-2.5 col-span-2">
              <p className="text-gray-400">ระยะเวลาผลิต</p>
              <p className="text-gray-700 mt-0.5">{item.leadTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            แท็กที่เกี่ยวข้อง
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
      </div>
    </div>
  );
}

