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
};

export type IExplorePageData = {
  pdShowcases: IExploreShowcase[];
  pmShowcases: IExploreShowcase[];
  idShowcases: IExploreShowcase[];
  mtShowcases: IExploreShowcase[];
  promoSlides: IExploreSlide[];
  promoCodes: IExploreSlide[];
};

export const EMPTY_EXPLORE_PAGE_DATA: IExplorePageData = {
  pdShowcases: [],
  pmShowcases: [],
  idShowcases: [],
  mtShowcases: [],
  promoSlides: [],
  promoCodes: [],
};
