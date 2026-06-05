export type FactoryItem = {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  minOrder: number;
  minOrderUnit?: string;
  verified?: boolean;
};
