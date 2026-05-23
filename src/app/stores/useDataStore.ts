import { create } from 'zustand';
import { getErrorMessage } from '@/lib/apiError';
import { asRecord } from '@/lib/apiShape';
import { useAuthStore } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { useSessionStore } from '@/stores/useSessionStore';
import { walletApi } from '@/services/api/userApi';
import { queryClient } from '@/lib/queryClient';
import { chatKeys, orderKeys, rfqKeys } from '@/lib/queryKeys';
import { refreshConversationsCache } from '@/domain/chat/chatCache';
import { fetchNotificationsList } from '@/domain/notifications/queries/useNotificationQueries';
import { mapNotificationToBootstrapModel } from '@/domain/notifications/mappers/mapNotification';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { fetchAndMapRfqList, mapRfqListFromBootstrap } from '@/domain/rfq/mappers/mapRfqList';
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
  // @deprecated Use chat query invalidation/refetch instead.
  refetchMessages: () => Promise<void>;
  // @deprecated Use `refreshConversationsCache` or `useConversationsQuery().refetch()`.
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

export const useDataStore = create<DataState & DataActions>((set) => {
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

      const u = session?.currentUser ? asRecord(session.currentUser) : undefined;
      const w = session?.wallet ? asRecord(session.wallet) : undefined;
      const rfqList = mapRfqListFromBootstrap(session);

      queryClient.setQueryData(rfqKeys.list(), rfqList);

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
        rfqs: rfqList.rfqs,
        orders: rfqList.orders,
        notifications: mappedNotifs,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set((state) => ({
        ...state,
        isLoading: false,
        error: getErrorMessage(err, 'โหลดข้อมูลไม่สำเร็จ'),
      }));
    }
  };

  return {
    ...INITIAL_STATE,

    refetch: async () => {
      await fetchAll();
    },

    refetchRfqs: async () => {
      const list = await fetchAndMapRfqList({ fresh: true });
      queryClient.setQueryData(rfqKeys.list(), list);
      set((state) => ({ ...state, rfqs: list.rfqs, orders: list.orders }));
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
      await frontendApi.getFactory(id).then((data) => {
        set((state) => {
          const factories = state.factories.map((f) =>
            f.id === id ? { ...f, ...(data.factory as Factory) } : f,
          );
          return { ...state, factories };
        });
      }).catch(() => {
        // 

      });
    },

    refetchWallet: async () => {
      await walletApi.getMe().then((w) => {
        const balance = w.good_fund ?? 0;
        const pending = w.pending_fund ?? 0;
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
      }).catch(() => {
        // 

      });
    },
  };
});

export const useData = useDataStore;
