export type ExploreContentType = 'product' | 'promotion' | 'idea' | 'material';

/** Domain model สำหรับหมวดหมู่บนหน้า Explore (camelCase หลัง map จาก API) */
export type IExploreCategory = {
  id: string;
  name: string;
  parentId?: string | null;
};

/** Domain model สำหรับการ์ด showcase บนหน้า Explore (camelCase หลัง map จาก API) */
export type IExploreShowcase = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  contentType: ExploreContentType;
  category: string;
  subCategoryName: string;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  tags: string[];
  factoryRating?: number;
  /** จังหวัดจาก API (province_name) — แสดงบนการ์ดเหมือน /factory-ideas */
  location?: string;
};

/** Factory card ที่ได้จาก GET /api/v1/explore → factories[] */
export type IExploreFactory = {
  id: number;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  minOrder: number;
  verified: boolean;
};

export type IExploreArticle = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  factoryName: string;
  likes: number;
};

export type IExploreSlide = {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  image: string;
  linkTo: string;
};

export type IExplorePageData = {
  categories: IExploreCategory[];
  pdShowcases: IExploreShowcase[];
  pmShowcases: IExploreShowcase[];
  idShowcases: IExploreShowcase[];
  mtShowcases: IExploreShowcase[];
  promoSlides: IExploreSlide[];
  promoCodes: IExploreSlide[];
  factories: IExploreFactory[];
};

export const EMPTY_EXPLORE_PAGE_DATA: IExplorePageData = {
  categories: [],
  pdShowcases: [],
  pmShowcases: [],
  idShowcases: [],
  mtShowcases: [],
  promoSlides: [],
  promoCodes: [],
  factories: [],
};
