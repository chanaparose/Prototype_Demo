import { create } from 'zustand';
import { useAuthStore, useAuth } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { useSessionStore } from '@/stores/useSessionStore';
import { walletApi } from '@/services/api/userApi';
import { queryClient } from '@/lib/queryClient';
import { chatKeys, orderKeys, rfqKeys } from '@/lib/queryKeys';
import { refreshConversationsCache } from '@/domain/chat/chatCache';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import {
  mapOrderStatusFromApi,
  guessOrderProgressFromStep,
  parseCurrentStepId,
} from '@/domain/order/status';
import type {
  BootstrapCategoryModel,
  Factory,
  FactoryProfile,
  FactoryReview,
  IdeaArticle,
  FactoryShowcase,
  Order,
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
  orders: Order[];
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
  patchCurrentUser: (patch: Partial<CurrentUser>) => void;
}

const INITIAL_STATE: DataState = {
  currentUser: null,
  categories: [],
  factories: [],
  factoryProfiles: [],
  factoryReviews: [],
  ideaArticles: [],
  factoryShowcases: [],
  orders: [],
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
      // Notifications and the RFQ list are owned by React Query (their own
      // hooks / SSE), so bootstrap only feeds the session + orders + current
      // user here — no second source of truth, and one fewer request on login.
      const [sessionRes] = await Promise.allSettled([frontendApi.getBootstrap()]);

      const session = sessionRes.status === 'fulfilled' ? sessionRes.value : null;

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
              avatar: pickScalarString(u.avatar ?? u.avatar_url) || undefined,
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
        orders: (() => {
          const raw = session?.orders;
          if (!Array.isArray(raw)) return [];
          return (raw as unknown as Record<string, unknown>[]).map((o) => {
            const status = mapOrderStatusFromApi(pickScalarString(o.status));
            const currentStepId = parseCurrentStepId(o.currentStepId ?? o.current_step_id);
            return {
              id: String(o.id ?? o.order_id ?? ''),
              rfqId: String(o.rfqId ?? o.rfq_id ?? ''),
              factoryId: String(o.factoryId ?? o.factory_id ?? ''),
              factoryName: pickScalarString(o.factoryName ?? o.factory_name),
              projectName: pickScalarString(o.projectName ?? o.project_name),
              category: pickScalarString(o.category),
              status,
              progress: guessOrderProgressFromStep(currentStepId, status),
              totalAmount: pickScalarNumber(o.totalAmount ?? o.total_amount) ?? 0,
              depositPaid: pickScalarNumber(o.depositPaid ?? o.deposit_paid) ?? 0,
              quantity: pickScalarNumber(o.quantity) ?? 0,
              createdAt: pickScalarString(o.createdAt ?? o.created_at),
              estimatedDelivery:
                pickScalarString(o.estimatedDelivery ?? o.estimated_delivery) || '',
              timeline: [],
              currentStepId,
            } as Order;
          });
        })(),
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
        const w = await walletApi.getMe();
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
      } catch {
        /* keep cached wallet */
      }
    },

    patchCurrentUser: (patch) => {
      set((state) => {
        if (!state.currentUser) return state;
        return {
          ...state,
          currentUser: { ...state.currentUser, ...patch },
        };
      });
    },
  };
});

export const useData = useDataStore;
