import React from 'react';
import { BadgeCheck, ChevronRight, MapPin, Star, Plus } from 'lucide-react';
import { ImageWithFallback } from '../../shared';

export type FactoryItem = {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  minOrder: number;
  verified?: boolean;
};

type ExploreFactoryGridProps = {
  factories: FactoryItem[];
  onFactoryClick: (id: string) => void;
  onSeeAll?: () => void;
};

export function ExploreFactoryGrid({ factories, onFactoryClick, onSeeAll }: ExploreFactoryGridProps) {
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden border border-gray-200 bg-white">
      {/* Header — matches desktop gradient */}
      <div className="relative px-3 py-3.5 text-center overflow-hidden" style={{ background: 'linear-gradient(120deg, #2D1B4E 0%, #3D2270 40%, #2D1B4E 100%)' }}>
        <div className="absolute top-0 right-0 h-full w-[45%] opacity-80 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, transparent 30%, #A238FF 100%)', clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute top-0 right-0 h-full w-[22%] opacity-60 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, #F28A2E 0%, #F27830 100%)', clipPath: 'polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />
        <div className="absolute -top-4 right-8 w-16 h-16 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ background: '#F5C8A0' }} />
        <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: '#A238FF' }} />
        <div className="absolute top-2 left-5 w-3 h-3 rounded-full opacity-50 pointer-events-none" style={{ background: '#F28A2E' }} />

        <div className="relative z-10">
          <h3 className="text-lg font-bold text-white drop-shadow-md flex items-center justify-center gap-2">
            โรงงานแนะนำ
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold" style={{ background: '#F28A2E' }}>
              <Plus size={12} />
            </span>
          </h3>
          <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(235,211,255,0.90)' }}>
            โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าคุณภาพสูง
          </p>
        </div>
      </div>

      {/* Factory Cards — Body Section: ลดความสูงการ์ด */}
      <div className="p-2 bg-gradient-to-b from-purple-50/20 to-white">
        <div className="grid grid-cols-2 gap-2">
          {factories.map((factory) => (
            <div
              key={factory.id}
              onClick={() => onFactoryClick(factory.id)}
              className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {factory.verified === true && (
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <BadgeCheck className="w-2.5 h-2.5 shrink-0" style={{ color: '#A238FF' }} />
                    <span className="font-medium text-[8px]" style={{ color: '#A238FF' }}>ยืนยัน</span>
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                <div>
                  <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                    {factory.name}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">{factory.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <div className="flex items-center gap-0.5 min-w-0">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
                    <span className="text-gray-400 text-[9px] truncate">({factory.reviews})</span>
                  </div>
                  <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {factory.minOrder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onSeeAll}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          >
            ดูเพิ่มเติม
          </button>
        </div>
      </div>
    </div>
  );
}
