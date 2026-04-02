import React from 'react';
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle, Star } from 'lucide-react';
import { ImageWithFallback } from '../../shared';

export type FactoryHeroInfo = {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  priceRange: string;
  verified?: boolean;
};

type FactoryProfileHeroProps = {
  factory: FactoryHeroInfo;
  onBack: () => void;
  onChat: () => void;
  chatLoading?: boolean;
};

export function FactoryProfileHero({ factory, onBack, onChat, chatLoading }: FactoryProfileHeroProps) {
  return (
    <div className="relative h-56">
      <ImageWithFallback
        src={factory.image}
        alt={factory.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-gray-700" />
      </button>
      <button
        type="button"
        onClick={onChat}
        disabled={chatLoading}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md disabled:opacity-60"
        aria-label="แชทกับโรงงาน"
      >
        {chatLoading ? (
          <span className="w-4 h-4 border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
        ) : (
          <MessageCircle className="w-5 h-5" style={{ color: '#6C47FF' }} />
        )}
      </button>
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-lg leading-tight" style={{ fontWeight: 700 }}>
            {factory.name}
          </p>
          {factory.verified && <BadgeCheck className="w-4 h-4 text-violet-200" />}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/90">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {factory.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            {factory.rating} ({factory.reviews})
          </span>
          <span>{factory.priceRange}</span>
        </div>
      </div>
    </div>
  );
}
