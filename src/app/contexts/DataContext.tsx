/**
 * DataContext — Global data store fetched from API
 *
 * This replaces the static mockData.ts imports.
 * Data is loaded after authentication from various /frontend/* endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { frontendApi, categoriesApi, showcasesApi, notificationsApi, conversationsApi } from '../services/api';
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

    // Helper: use API data if non-empty array, otherwise fallback to local mockData
    const arr = <T,>(apiVal: unknown, fb: T[]): T[] => {
      const a = apiVal as T[] | undefined;
      return Array.isArray(a) && a.length > 0 ? a : fb;
    };

    try {
      // ── เรียกเฉพาะ core data (ไม่รวม showcases — แต่ละหน้าโหลดเอง) ──
      const [bootstrapRes, notifRes, convsRes] = await Promise.allSettled([
        frontendApi.getBootstrap(),   // user, categories, factories, rfqs, orders
        notificationsApi.list(),      // notifications
        conversationsApi.list(),      // conversations
      ]);

      const boot = bootstrapRes.status === 'fulfilled' ? bootstrapRes.value : null;
      const rawNotifs = notifRes.status === 'fulfilled'
        ? (Array.isArray(notifRes.value) ? notifRes.value : []) as Record<string, unknown>[]
        : [];
      const rawConvs = convsRes.status === 'fulfilled'
        ? (Array.isArray(convsRes.value) ? convsRes.value : []) as Record<string, unknown>[]
        : [];

      // ── แปลง notifications ────────────────────────────────────────────
      const mappedNotifs: Notification[] = rawNotifs.map((r) => ({
        id: String(r.notification_id ?? r.id ?? ''),
        type: String(r.type ?? ''),
        title: String(r.title ?? ''),
        message: String(r.message ?? r.body ?? ''),
        time: String(r.created_at ?? r.time ?? ''),
        read: Boolean(r.is_read ?? r.read ?? false),
        linkTo: String(r.link_to ?? r.linkTo ?? ''),
        avatar: String(r.avatar ?? ''),
        rfqId: r.rfq_id ? String(r.rfq_id) : undefined,
        orderId: r.order_id ? String(r.order_id) : undefined,
        conversationId: r.conversation_id ? String(r.conversation_id) : undefined,
      })).filter((n) => n.id);

      // ── แปลง conversations ────────────────────────────────────────────
      const mappedConvs: Conversation[] = rawConvs.map((r) => ({
        id: String(r.conversation_id ?? r.id ?? ''),
        factoryId: String(r.factory_id ?? r.factoryId ?? ''),
        rfqId: String(r.rfq_id ?? r.rfqId ?? ''),
        factoryName: String(r.factory_name ?? r.factoryName ?? ''),
        factoryAvatar: String(r.factory_avatar ?? r.factoryAvatar ?? ''),
        rfqName: String(r.rfq_name ?? r.rfqName ?? ''),
        lastMessage: String(r.last_message ?? r.lastMessage ?? ''),
        time: String(r.updated_at ?? r.time ?? ''),
        unread: Number(r.unread_count ?? r.unread ?? 0),
        hasQuote: Boolean(r.has_quote ?? r.hasQuote ?? false),
        messages: [],
      })).filter((c) => c.id);

      console.info('[DataContext] bootstrap:', bootstrapRes.status, '| notifs:', rawNotifs.length, '| convs:', rawConvs.length);

      setState({
        currentUser: (boot?.currentUser as CurrentUser) ?? (fallbackData.currentUser as CurrentUser),
        categories: arr<Category>(boot?.categories, fallbackData.categories as Category[]),
        factories: arr<Factory>(boot?.factories, fallbackData.factories as Factory[]),
        factoryProfiles: fallbackData.factoryProfiles as FactoryProfile[],
        factoryReviews: fallbackData.factoryReviews as FactoryReview[],
        // showcases/ideas → ไม่โหลดที่นี่ แต่ละหน้าโหลดเอง (explore, factory-ideas)
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: arr<Rfq>(boot?.rfqs, fallbackData.rfqs as Rfq[]),
        orders: arr<Order>(boot?.orders, fallbackData.orders as Order[]),
        conversations: mappedConvs.length > 0 ? mappedConvs : (fallbackData.conversations as Conversation[]),
        notifications: mappedNotifs.length > 0 ? mappedNotifs : (fallbackData.notifications as Notification[]),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('DataContext fetchAll failed:', err);
      setState({
        currentUser: fallbackData.currentUser as CurrentUser,
        categories: fallbackData.categories as Category[],
        factories: fallbackData.factories as Factory[],
        factoryProfiles: fallbackData.factoryProfiles as FactoryProfile[],
        factoryReviews: fallbackData.factoryReviews as FactoryReview[],
        // ❌ ไม่ใช้ mock data สำหรับ showcases/ideas — แสดงว่างเปล่าถ้า API fail
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: fallbackData.rfqs as Rfq[],
        orders: fallbackData.orders as Order[],
        conversations: fallbackData.conversations as Conversation[],
        notifications: fallbackData.notifications as Notification[],
        isLoading: false,
        error: String(err),
      });
    }
  }, [isAuthenticated]);

  // Initial fetch หลัง auth พร้อม
  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading, fetchAll]);

  // Refetch เมื่อ user กลับมาที่ tab (visibility change) — หยุด stale data
  const lastFetchRef = useRef<number>(0);
  useEffect(() => {
    if (!isAuthenticated) return;
    const STALE_MS = 60_000; // refetch ถ้าข้อมูลเก่ากว่า 1 นาที
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchRef.current > STALE_MS) {
          lastFetchRef.current = now;
          fetchAll();
        }
      }
    };
    const onOnline = () => fetchAll();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [isAuthenticated, fetchAll]);

  // Granular refetch methods for updating specific slices
  const refetchRfqs = async () => {
    try {
      const data = await frontendApi.getBootstrap();
      setState((prev) => ({
        ...prev,
        rfqs: (Array.isArray(data.rfqs) && data.rfqs.length > 0 ? data.rfqs : prev.rfqs) as Rfq[],
      }));
    } catch (err) {
      console.error('Failed to refetch RFQs:', err);
    }
  };

  const refetchOrders = async () => {
    try {
      const data = await frontendApi.getBootstrap();
      setState((prev) => ({
        ...prev,
        orders: (Array.isArray(data.orders) && data.orders.length > 0 ? data.orders : prev.orders) as Order[],
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
