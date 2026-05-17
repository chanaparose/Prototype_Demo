import { CarouselLightbox } from '@/components/ui/carousel';

type OrderPhotoGalleryProps = {
  photoUrl: string | null;
  onClose: () => void;
};

export function OrderPhotoGallery({ photoUrl, onClose }: OrderPhotoGalleryProps) {
  return (
    <CarouselLightbox
      images={photoUrl ? [photoUrl] : []}
      openIndex={photoUrl ? 0 : null}
      alt='milestone'
      onClose={onClose}
    />
  );
}
