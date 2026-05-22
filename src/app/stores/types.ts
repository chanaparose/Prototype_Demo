/**
 * Legacy bootstrap/store UI models.
 * These are camelCase client models, not API response contracts.
 */
export type BootstrapCategoryModel = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type BootstrapFactoryModel = {
  id: string;
  name: string;
  location: string;
  provinceName?: string;
  rating: number;
  reviews: number;
  specialization: string;
  tags: string[];
  minOrder: number;
  leadTime: string;
  image: string;
  coverImageUrl?: string;
  verified: boolean;
  completedOrders: number;
  priceRange: string;
  factoryTypeName?: string;
};

export type BootstrapFactoryProfileModel = {
  factoryId: string;
  address: string;
  acceptedProductTypes: string[];
  certificates: string[];
};

export type BootstrapFactoryReviewModel = {
  id: string;
  factoryId: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  helpfulCount?: number;
  optionText?: string;
  imageUrls?: string[];
};

export type BootstrapIdeaArticleModel = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  publishedAt: string;
};

export type ShowcaseSectionItem = {
  item_id: number;
  title: string | null;
  description: string;
  icon_name: string | null;
  sort_order: number;
};

export type ShowcaseSection = {
  section_id: number;
  section_type: 'highlight' | 'checklist';
  section_title: string;
  sort_order: number;
  items: ShowcaseSectionItem[];
};

export type ShowcaseImageRow = Record<string, unknown>;

export type ShowcaseSpecRow = {
  spec_key: string;
  spec_value: string;
  sort_order?: number;
};

export type BootstrapFactoryShowcaseModel = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  description?: string;
  content?: string;
  image: string;
  imageUrls?: string[];
  contentType: 'product' | 'promotion' | 'idea' | 'material';
  category: string;
  categoryId?: string;
  sub_category_id?: number;
  sub_category_name?: string | null;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  basePrice?: number;
  promoPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  priceRange?: string;
  tags: string[];
  factoryImageUrl?: string;
  factoryRating?: number;
  factoryVerified?: boolean;
  sections?: ShowcaseSection[];
  images?: ShowcaseImageRow[];
  specs?: ShowcaseSpecRow[];
  linkedShowcases?: (string | number)[];
};

export type BootstrapRfqOfferModel = {
  id: string;
  factoryId: string;
  factoryName: string;
  price: number;
  leadTime: number;
  rating: number;
  verified: boolean;
  recommended: boolean;
  aiReason: string;
  factoryHighlight?: string;
  completedOrders: number;
  responseTime: string;
  quoteStatus?: string;
  orderId?: string;
};

export type BootstrapRfqModel = {
  id: string;
  projectName: string;
  category: string;
  categoryIcon: string;
  status: string;
  offerCount: number;
  budget: number;
  quantity: number;
  material: string;
  deadline: string;
  createdAt: string;
  description: string;
  imageUrls: string[];
  offers: BootstrapRfqOfferModel[];
  subCategoryName?: string;
  subCategoryId?: number;
  shippingMethodName?: string;
  deliveryAddress?: string;
  materialGrade?: string;
  tolerance?: string;
  colorFinish?: string;
  dimensionSpec?: string;
  weightTargetG?: number;
  packagingSpec?: string;
  targetLeadTimeDays?: number;
  requiredDeliveryDate?: string;
  certificationsRequired?: string[];
};

export type OrderTimeline = {
  id: string;
  title: string;
  date: string;
  status: string;
  photo: string | null;
  description: string;
};

export type BootstrapOrderModel = {
  id: string;
  rfqId: string;
  factoryId: string;
  factoryName: string;
  projectName: string;
  category: string;
  status: string;
  progress: number;
  totalAmount: number;
  depositPaid: number;
  quantity: number;
  createdAt: string;
  estimatedDelivery: string;
  timeline: OrderTimeline[];
  /** step_id ของขั้นตอนที่ active ล่าสุด (มาจาก production_updates) — ใช้แยก tab เช่น 4 = จัดส่ง */
  currentStepId?: number;
};

export type Message = {
  id: string;
  sender: 'factory' | 'user';
  text: string;
  time: string;
  type: 'text' | 'quote';
  quoteData?: { price: number; leadTime: number; validUntil: string };
};

export type BootstrapConversationModel = {
  id: string;
  factoryId: string;
  rfqId: string;
  factoryName: string;
  factoryAvatar: string;
  rfqName: string;
  lastMessage: string;
  time: string;
  unread: number;
  hasQuote: boolean;
  messages: Message[];
};

export type BootstrapNotificationModel = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  linkTo: string;
  avatar: string;
  rfqId?: string;
  orderId?: string;
  conversationId?: string;
};

export type BootstrapCurrentUserModel = {
  id: string;
  name: string;
  nameEn?: string;
  avatar: string;
  company: string;
  email: string;
  phone: string;
  walletBalance: number;
  pendingBalance: number;
  memberSince: string;
};

export type Factory = BootstrapFactoryModel;
export type FactoryProfile = BootstrapFactoryProfileModel;
export type FactoryReview = BootstrapFactoryReviewModel;
export type IdeaArticle = BootstrapIdeaArticleModel;
export type FactoryShowcase = BootstrapFactoryShowcaseModel;
export type RfqOffer = BootstrapRfqOfferModel;
export type Rfq = BootstrapRfqModel;
export type Order = BootstrapOrderModel;
export type Conversation = BootstrapConversationModel;
export type Notification = BootstrapNotificationModel;
export type CurrentUser = BootstrapCurrentUserModel;
