import React from 'react';
import { BadgeCheck, ChevronRight, MapPin, Star } from 'lucide-react';
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
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
          โรงงานแนะนำ
        </h3>
        <button type="button" className="flex items-center gap-0.5 text-purple-600" style={{ fontSize: 13 }}>
          ดูทั้งหมด
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {factories.map((factory) => (
          <div
            key={factory.id}
            onClick={() => onFactoryClick(factory.id)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="relative h-28">
              <ImageWithFallback
                src={factory.image}
                alt={factory.name}
                className="w-full h-full object-cover"
              />
              {factory.verified && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-purple-600" style={{ fontSize: 10 }}>
                    ยืนยันแล้ว
                  </span>
                </div>
              )}
              <div
                className="absolute top-2 right-2 bg-purple-600/90 text-white rounded-full px-2 py-0.5"
                style={{ fontSize: 10 }}
              >
                {factory.priceRange}
              </div>
            </div>
            <div className="p-3">
              <p className="text-gray-800 truncate mb-1" style={{ fontSize: 13 }}>
                {factory.name}
              </p>
              <div className="flex items-center gap-1 mb-1.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500" style={{ fontSize: 11 }}>
                  {factory.location}
                </span>
              </div>
              <div className="flex items-center justify-between">
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
    </div>
  );
}
