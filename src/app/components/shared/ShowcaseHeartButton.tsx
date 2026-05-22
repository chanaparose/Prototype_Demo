import React from 'react';
import { Heart } from 'lucide-react';

type Props = {
  showcaseId: string | number;
  isLiked: boolean;
  onToggle: (id: string | number) => void;
  size?: 'sm' | 'md';
  className?: string;
};

export function ShowcaseHeartButton({ showcaseId, isLiked, onToggle, size = 'sm', className = '' }: Props) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const btnSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <button
      type='button'
      aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle(showcaseId);
      }}
      className={`${btnSize} flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all ${className}`}
    >
      <Heart
        className={`${iconSize} transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
      />
    </button>
  );
}
