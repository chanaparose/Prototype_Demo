export type ExploreContentType = 'product' | 'promotion' | 'idea' | 'material';

export type IExploreCategory = {
  id: string;
  name: string;
  parentId?: string | null;
};

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
};

export const EMPTY_EXPLORE_PAGE_DATA: IExplorePageData = {
  categories: [],
  pdShowcases: [],
  pmShowcases: [],
  idShowcases: [],
  mtShowcases: [],
  promoSlides: [],
  promoCodes: [],
};
