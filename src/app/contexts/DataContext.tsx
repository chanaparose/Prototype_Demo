/**
 * DataContext — Global data store fetched from API
 *
 * This replaces the static mockData.ts imports.
 * Data is loaded after authentication from various /frontend/* endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { frontendApi, categoriesApi, masterApi } from '../services/api';

// ─── Types (matching mockData shapes) ───────────────────────────
export type Category = {
  id: string;
  name: string;
  parentId?: string | null;
};

export type Factory = {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  specialization: string;
  tags: string[];
  minOrder: number;
  leadTime: string;
  image: string;
  verified: boolean;
  completedOrders: number;
  priceRange: string;
};

export type FactoryProfile = {
  factoryId: string;
  address: string;
  acceptedProductTypes: string[];
  certificates: string[];
};

export type FactoryReview = {
  id: string;
  factoryId: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
};

export type IdeaArticle = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  publishedAt: string;
};

export type FactoryShowcase = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  contentType: 'product' | 'promotion' | 'idea';
  category: string;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  tags: string[];
};

export type RfqOffer = {
  id: string;
  factoryId: string;
  factoryName: string;
  price: number;
  leadTime: number;
  rating: number;
  verified: boolean;
  recommended: boolean;
  aiReason: string;
  completedOrders: number;
  responseTime: string;
};

export type Rfq = {
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
  offers: RfqOffer[];
};

export type OrderTimeline = {
  id: string;
  title: string;
  date: string;
  status: string;
  photo: string | null;
  description: string;
};

export type Order = {
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
};

export type Message = {
  id: string;
  sender: 'factory' | 'user';
  text: string;
  time: string;
  type: 'text' | 'quote';
  quoteData?: { price: number; leadTime: number; validUntil: string };
};

export type Conversation = {
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

export type Notification = {
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

export type CurrentUser = {
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

// ─── Data Store ─────────────────────────────────────────────────
type DataState = {
  currentUser: CurrentUser | null;
  categories: Category[];
  factories: Factory[];
  factoryProfiles: FactoryProfile[];
  factoryReviews: FactoryReview[];
  ideaArticles: IdeaArticle[];
  factoryShowcases: FactoryShowcase[];
  rfqs: Rfq[];
  orders: Order[];
  conversations: Conversation[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
};

type DataContextType = DataState & {
  refetch: () => Promise<void>;
  refetchRfqs: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchMessages: () => Promise<void>;
  refetchFactory: (id: string) => Promise<void>;
};

const INITIAL_STATE: DataState = {
  currentUser: null,
  categories: [],
  factories: [],
  factoryProfiles: [],
  factoryReviews: [],
  ideaArticles: [],
  factoryShowcases: [],
  rfqs: [],
  orders: [],
  conversations: [],
  notifications: [],
  isLoading: true,
  error: null,
};

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<DataState>(INITIAL_STATE);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) {
      setState(INITIAL_STATE);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch mock-data and product categories in parallel
      const [data, rawCats] = await Promise.all([
        frontendApi.getMockData(),
        masterApi.productCategories().catch(() => [] as unknown[]),
      ]);

      // Debug: log raw response to inspect field names
      console.log('[DataContext] rawCats sample:', (rawCats as any[])?.[0]);

      // Map lbi_product_categories rows → Category
      // Try multiple possible field name conventions from the API
      const categories: Category[] = (rawCats as any[])
        .filter((c) => {
          const active = c.is_active ?? c.isActive ?? c.active ?? c.status ?? 1;
          return active !== 0 && active !== false && active !== 'inactive';
        })
        .map((c) => ({
          id: String(c.id ?? c.category_id ?? c.categoryId ?? ''),
          name: c.name ?? c.name_th ?? c.category_name ?? c.categoryName ?? c.label ?? '',
          parentId: (c.parent_id ?? c.parentId ?? c.parent_category_id ?? null) != null
            ? String(c.parent_id ?? c.parentId ?? c.parent_category_id)
            : null,
        }))
        .filter((c) => c.id && c.name);

      setState({
        currentUser: (data.currentUser as CurrentUser) ?? null,
        categories: categories.length > 0 ? categories : ((data.categories as Category[]) ?? []),
        factories: (data.factories as Factory[]) ?? [],
        factoryProfiles: (data.factoryProfiles as FactoryProfile[]) ?? [],
        factoryReviews: (data.factoryReviews as FactoryReview[]) ?? [],
        ideaArticles: (data.ideaArticles as IdeaArticle[]) ?? [],
        factoryShowcases: (data.factoryShowcases as FactoryShowcase[]) ?? [],
        rfqs: (data.rfqs as Rfq[]) ?? [],
        orders: (data.orders as Order[]) ?? [],
        conversations: (data.conversations as Conversation[]) ?? [],
        notifications: (data.notifications as Notification[]) ?? [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading, fetchAll]);

  // Granular refetch methods for updating specific slices
  const refetchRfqs = async () => {
    try {
      const data = await frontendApi.getMockData();
      setState((prev) => ({
        ...prev,
        rfqs: (data.rfqs as Rfq[]) ?? prev.rfqs,
      }));
    } catch (err) {
      console.error('Failed to refetch RFQs:', err);
    }
  };

  const refetchOrders = async () => {
    try {
      const data = await frontendApi.getMockData();
      setState((prev) => ({
        ...prev,
        orders: (data.orders as Order[]) ?? prev.orders,
      }));
    } catch (err) {
      console.error('Failed to refetch orders:', err);
    }
  };

  const refetchMessages = async () => {
    try {
      const threads = await frontendApi.getMessageThreads();
      setState((prev) => ({
        ...prev,
        conversations: (threads as Conversation[]) ?? prev.conversations,
      }));
    } catch (err) {
      console.error('Failed to refetch messages:', err);
    }
  };

  const refetchFactory = async (id: string) => {
    try {
      const data = await frontendApi.getFactory(id);
      // Update factory in list if it exists
      setState((prev) => {
        const factories = prev.factories.map((f) =>
          f.id === id ? { ...f, ...(data.factory as Factory) } : f,
        );
        return { ...prev, factories };
      });
    } catch (err) {
      console.error('Failed to refetch factory:', err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        ...state,
        refetch: fetchAll,
        refetchRfqs,
        refetchOrders,
        refetchMessages,
        refetchFactory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
