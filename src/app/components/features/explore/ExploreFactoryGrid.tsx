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
  priceRange: string;
  verified?: boolean;
};

type ExploreFactoryGridProps = {
  factories: FactoryItem[];
  onFactoryClick: (id: string) => void;
};

export function ExploreFactoryGrid({ factories, onFactoryClick }: ExploreFactoryGridProps) {
  return (
    <div className="mb-5">
      {/* Purple Header */}
      <div className="mx-4 rounded-t-2xl bg-[#7B10A8] px-4 py-3 text-center relative overflow-hidden">
        <div className="absolute top-0 right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-6 left-6 w-16 h-16 bg-black/10 rounded-full blur-xl"></div>
        <h3 className="text-base font-bold text-white relative z-10 flex items-center justify-center gap-1.5">
          โรงงานแนะนำ <Plus size={16} />
        </h3>
        <p className="text-white/80 text-[10px] mt-0.5 relative z-10">
          โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าคุณภาพ
        </p>
      </div>

      {/* Factory Cards */}
      <div className="mx-4 rounded-b-2xl border border-t-0 border-gray-200 bg-gradient-to-b from-purple-50/30 to-white p-3">
        <div className="grid grid-cols-2 gap-3">
          {factories.map((factory) => (
            <div
              key={factory.id}
              onClick={() => onFactoryClick(factory.id)}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="relative h-28 overflow-hidden">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {factory.verified && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#A020C8]" />
                    <span className="text-[#A020C8]" style={{ fontSize: 10 }}>
                      ยืนยันแล้ว
                    </span>
                  </div>
                )}
                <div
                  className="absolute top-2 right-2 bg-[#2D1060]/90 text-white rounded-full px-2 py-0.5"
                  style={{ fontSize: 10 }}
                >
                  {factory.priceRange}
                </div>
              </div>
              <div className="p-3">
                <p className="text-gray-800 truncate mb-1 group-hover:text-[#A020C8] transition-colors" style={{ fontSize: 13 }}>
                  {factory.name}
                </p>
                <div className="flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500" style={{ fontSize: 11 }}>
                    {factory.location}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-gray-700" style={{ fontSize: 12 }}>
                      {factory.rating}
                    </span>
                    <span className="text-gray-400" style={{ fontSize: 11 }}>
                      ({factory.reviews})
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-1" style={{ fontSize: 10 }}>
                  ขั้นต่ำ {factory.minOrder}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-2 rounded-lg text-xs font-medium transition-colors">
            ดูเพิ่มเติม
          </button>
        </div>
      </div>
    </div>
  );
}
