import { create } from 'zustand';
import { useAuthStore, useAuth } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { useSessionStore } from '@/stores/useSessionStore';
import { walletApi } from '@/services/api/userApi';
import { queryClient } from '@/lib/queryClient';
import { chatKeys, orderKeys, rfqKeys } from '@/lib/queryKeys';
import { refreshConversationsCache } from '@/domain/chat/chatCache';
import { fetchNotificationsList } from '@/domain/notifications/queries/useNotificationQueries';
import { mapNotificationToBootstrapModel } from '@/domain/notifications/mappers/mapNotification';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import type {
  BootstrapCategoryModel,
  Factory,
  FactoryProfile,
  FactoryReview,
  IdeaArticle,
  FactoryShowcase,
  Rfq,
  Order,
  Notification,
  CurrentUser,
} from '@/stores/types';

export interface DataState {
  currentUser: CurrentUser | null;
  categories: BootstrapCategoryModel[];
  factories: Factory[];
  factoryProfiles: FactoryProfile[];
  factoryReviews: FactoryReview[];
  ideaArticles: IdeaArticle[];
  factoryShowcases: FactoryShowcase[];
  rfqs: Rfq[];
  orders: Order[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

export interface DataActions {
  refetch: () => Promise<void>;
  refetchRfqs: () => Promise<void>;
  refetchRfq: (id: string) => Promise<void>;
  refetchOrders: () => Promise<void>;
  /** @deprecated Use chat query invalidation/refetch instead. */
  refetchMessages: () => Promise<void>;
  /** @deprecated Use `refreshConversationsCache` or `useConversationsQuery().refetch()`. */
  refetchConversations: () => Promise<void>;
  refetchFactory: (id: string) => Promise<void>;
  refetchWallet: () => Promise<void>;
}

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
  notifications: [],
  isLoading: false,
  error: null,
};

let lastFetchTime = 0;
const STALE_MS = 60_000; // 1 minute

export const useDataStore = create<DataState & DataActions>((set, get) => {
  const fetchAll = async () => {
    const rawAuthState = useAuthStore.getState();
    const isAuthenticated = rawAuthState.isAuthenticated;

    if (!isAuthenticated) {
      // Guest: bootstrap returns only empty shells — no categories/factories anymore
      // (they come from GET /explore which the explore page loads on its own)
      set({ ...INITIAL_STATE, isLoading: false, error: null });
      return;
    }

    set((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const [sessionRes, notifRes] = await Promise.allSettled([
        frontendApi.getBootstrap(),
        fetchNotificationsList(),
      ]);

      const session = sessionRes.status === 'fulfilled' ? sessionRes.value : null;
      const notificationModels = notifRes.status === 'fulfilled' ? notifRes.value : [];

      const mappedNotifs: Notification[] = notificationModels.map(
        mapNotificationToBootstrapModel,
      );

      useSessionStore.setState({
        data: session,
        isLoading: false,
        error: null,
        lastFetchedAt: session ? Date.now() : null,
      });

      const u = session?.currentUser as unknown as Record<string, unknown> | undefined;
      const w = session?.wallet as unknown as Record<string, unknown> | undefined;

      set({
        currentUser: u
          ? ({
              id: pickScalarString(u.id),
              name: pickScalarString(u.name),
              nameEn: u.nameEn != null ? pickScalarString(u.nameEn) : undefined,
              avatar: pickScalarString(u.avatar) || undefined,
              company: pickScalarString(u.company) || undefined,
              email: pickScalarString(u.email),
              phone: pickScalarString(u.phone),
              walletBalance: pickScalarNumber(w?.balance ?? u.walletBalance) ?? 0,
              pendingBalance: pickScalarNumber(w?.pending_balance ?? u.pendingBalance) ?? 0,
              memberSince: pickScalarString(u.member_since ?? u.memberSince),
            } as CurrentUser)
          : null,
        categories: [],
        factories: [],
        factoryProfiles: [],
        factoryReviews: [],
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: [],
        orders: [],
        notifications: mappedNotifs,
        isLoading: false,
        error: null,
      });
      lastFetchTime = Date.now();
    } catch (err) {
      set((state) => ({
        ...state,
        isLoading: false,
        error: err instanceof Error ? err.message : pickScalarString(err) || 'โหลดข้อมูลไม่สำเร็จ',
      }));
    }
  };

  return {
    ...INITIAL_STATE,

    refetch: async () => {
      await fetchAll();
    },

    refetchRfqs: async () => {
      await queryClient.invalidateQueries({ queryKey: rfqKeys.list() });
    },

    refetchRfq: async (id: string) => {
      await queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: rfqKeys.list() });
    },

    refetchOrders: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },

    refetchMessages: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },

    refetchConversations: async () => {
      await refreshConversationsCache();
    },

    refetchFactory: async (id: string) => {
      try {
        const data = await frontendApi.getFactory(id);
        set((state) => {
          const factories = state.factories.map((f) =>
            f.id === id ? { ...f, ...(data.factory as Factory) } : f,
          );
          return { ...state, factories };
        });
      } catch {
        /* keep cached factory row */
      }
    },

    refetchWallet: async () => {
      try {
        const w = (await walletApi.getBalance()) as Record<string, unknown>;
        const balance = pickScalarNumber(w.good_fund, w.walletBalance) ?? 0;
        const pending = pickScalarNumber(w.pending_fund, w.pendingBalance) ?? 0;
        set((state) => {
          if (!state.currentUser) return state;
          return {
            ...state,
            currentUser: {
              ...state.currentUser,
              walletBalance: balance,
              pendingBalance: pending,
            },
          };
        });
      } catch {
        /* keep cached wallet */
      }
    },
  };
});

export const useData = useDataStore;
