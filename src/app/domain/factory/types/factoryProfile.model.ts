/** การ์ด showcase บนแท็บโปรไฟล์โรงงาน (public factory detail) */
export type IFactoryProfileShowcase = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  minOrder?: number;
  basePrice?: number;
  promoPrice?: number;
  priceRange?: string;
  leadTime?: string;
  postedAt?: string;
};
