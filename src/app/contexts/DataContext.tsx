/**
 * DataContext — Global data store fetched from API
 *
 * This replaces the static mockData.ts imports.
 * Data is loaded after authentication from various /frontend/* endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { frontendApi, categoriesApi } from '../services/api';
import * as fallbackData from '../data/mockData';

// ─── Types (matching mockData shapes) ───────────────────────────
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
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
      // Use the mock-data endpoint first for a complete dataset,
      // then we can also call granular endpoints for fresh data on specific pages
      const data = await frontendApi.getMockData();

      // Helper: use API data if non-empty array, otherwise fallback to local mockData
      const arr = <T,>(apiVal: unknown, fb: T[]): T[] => {
        const a = apiVal as T[] | undefined;
        return Array.isArray(a) && a.length > 0 ? a : fb;
      };

      setState({
        currentUser: (data.currentUser as CurrentUser) ?? (fallbackData.currentUser as CurrentUser),
        categories: arr<Category>(data.categories, fallbackData.categories as Category[]),
        factories: arr<Factory>(data.factories, fallbackData.factories as Factory[]),
        factoryProfiles: arr<FactoryProfile>(data.factoryProfiles, fallbackData.factoryProfiles as FactoryProfile[]),
        factoryReviews: arr<FactoryReview>(data.factoryReviews, fallbackData.factoryReviews as FactoryReview[]),
        ideaArticles: arr<IdeaArticle>(data.ideaArticles, fallbackData.ideaArticles as IdeaArticle[]),
        factoryShowcases: arr<FactoryShowcase>(data.factoryShowcases, fallbackData.factoryShowcases as FactoryShowcase[]),
        rfqs: arr<Rfq>(data.rfqs, fallbackData.rfqs as Rfq[]),
        orders: arr<Order>(data.orders, fallbackData.orders as Order[]),
        conversations: arr<Conversation>(data.conversations, fallbackData.conversations as Conversation[]),
        notifications: arr<Notification>(data.notifications, fallbackData.notifications as Notification[]),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to fetch data, using fallback:', err);
      // ถ้า API ล้มเหลวทั้งหมด ใช้ mockData แทน
      setState({
        currentUser: fallbackData.currentUser as CurrentUser,
        categories: fallbackData.categories as Category[],
        factories: fallbackData.factories as Factory[],
        factoryProfiles: fallbackData.factoryProfiles as FactoryProfile[],
        factoryReviews: fallbackData.factoryReviews as FactoryReview[],
        ideaArticles: fallbackData.ideaArticles as IdeaArticle[],
        factoryShowcases: fallbackData.factoryShowcases as FactoryShowcase[],
        rfqs: fallbackData.rfqs as Rfq[],
        orders: fallbackData.orders as Order[],
        conversations: fallbackData.conversations as Conversation[],
        notifications: fallbackData.notifications as Notification[],
        isLoading: false,
        error: null,
      });
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
