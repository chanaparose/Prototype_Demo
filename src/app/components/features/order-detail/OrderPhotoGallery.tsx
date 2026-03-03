import React from 'react';
import { X } from 'lucide-react';

type OrderPhotoGalleryProps = {
  photoUrl: string | null;
  onClose: () => void;
};

export function OrderPhotoGallery({ photoUrl, onClose }: OrderPhotoGalleryProps) {
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
        onClick={onClose}
        type="button"
      >
        <X size={20} className="text-white" />
      </button>
      <img
        src={photoUrl}
        alt="milestone"
        className="max-w-full max-h-[80vh] rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
