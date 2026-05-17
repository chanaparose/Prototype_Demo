import { create } from 'zustand';
import { useAuth } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { notificationsApi, conversationsApi } from '@/services/api/chatApi';
import { walletApi } from '@/services/api/userApi';
import { queryClient } from '@/lib/queryClient';
import { orderKeys, rfqKeys } from '@/lib/queryKeys';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { normalizeFactoryRow, mapConversationRowsFromApi } from '@/stores/utils';
import type {
  Category,
  Factory,
  FactoryProfile,
  FactoryReview,
  IdeaArticle,
  FactoryShowcase,
  Rfq,
  Order,
  Conversation,
  Notification,
  CurrentUser,
} from '@/stores/types';

export interface DataState {
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
}

export interface DataActions {
  refetch: () => Promise<void>;
  refetchRfqs: () => Promise<void>;
  refetchRfq: (id: string) => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchMessages: () => Promise<void>;
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
  conversations: [],
  notifications: [],
  isLoading: false,
  error: null,
};

let lastFetchTime = 0;
const STALE_MS = 60_000; // 1 minute

export const useDataStore = create<DataState & DataActions>((set, get) => {
  const fetchAll = async () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      set({ isLoading: true, error: null });
      try {
        const boot = await frontendApi.getBootstrap();
        const factoryList: Factory[] = (() => {
          const raw = boot?.factories;
          if (!Array.isArray(raw)) return [];
          return (raw as Record<string, unknown>[])
            .map((row) => normalizeFactoryRow(row))
            .filter((f) => f.id && f.name);
        })();
        const categories: Category[] = (() => {
          const raw = boot?.categories;
          if (!Array.isArray(raw) || raw.length === 0) return [];
          return (raw as Record<string, unknown>[]).map((c) => {
            const name = String(c.name ?? '');
            return {
              id: String(c.id ?? c.category_id ?? ''),
              name,
              icon: String(c.icon ?? '') || guessCategoryIcon(name),
              color: String(c.color ?? 'var(--brand-violet)'),
            } as Category;
          });
        })();
        set({
          ...INITIAL_STATE,
          categories,
          factories: factoryList,
          isLoading: false,
          error: null,
        });
      } catch {
        set({ ...INITIAL_STATE, isLoading: false, error: null });
      }
      return;
    }

    set((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const [bootstrapRes, notifRes, convsRes] = await Promise.allSettled([
        frontendApi.getBootstrap(),
        notificationsApi.list(),
        conversationsApi.list(),
      ]);

      const boot = bootstrapRes.status === 'fulfilled' ? bootstrapRes.value : null;
      const rawNotifs =
        notifRes.status === 'fulfilled'
          ? ((Array.isArray(notifRes.value) ? notifRes.value : []) as Record<string, unknown>[])
          : [];
      const rawConvs =
        convsRes.status === 'fulfilled'
          ? ((Array.isArray(convsRes.value) ? convsRes.value : []) as Record<string, unknown>[])
          : [];

      const mappedNotifs: Notification[] = rawNotifs
        .map((r) => ({
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
        }))
        .filter((n) => n.id);

      const mappedConvs: Conversation[] = mapConversationRowsFromApi(rawConvs);

      const factoryList: Factory[] = (() => {
        const raw = boot?.factories;
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[])
          .map((row) => normalizeFactoryRow(row))
          .filter((f) => f.id && f.name);
      })();

      set({
        currentUser: boot?.currentUser
          ? (() => {
              const u = boot.currentUser;
              return {
                id: String(u.id ?? ''),
                name: String(u.name ?? ''),
                nameEn: u.nameEn ? String(u.nameEn) : undefined,
                avatar: String(u.avatar ?? ''),
                company: String(u.company ?? ''),
                email: String(u.email ?? ''),
                phone: String(u.phone ?? ''),
                walletBalance: Number(u.walletBalance ?? 0),
                pendingBalance: Number(u.pendingBalance ?? 0),
                memberSince: String(u.memberSince ?? ''),
              } as CurrentUser;
            })()
          : null,
        categories: (() => {
          const raw = boot?.categories;
          if (Array.isArray(raw) && raw.length > 0) {
            return (raw as Record<string, unknown>[]).map((c) => {
              const name = String(c.name ?? '');
              return {
                id: String(c.id ?? c.category_id ?? ''),
                name,
                icon: String(c.icon ?? '') || guessCategoryIcon(name),
                color: String(c.color ?? 'var(--brand-violet)'),
              } as Category;
            });
          }
          return [];
        })(),
        factories: factoryList,
        factoryProfiles: [],
        factoryReviews: [],
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: [],
        orders: [],
        conversations: mappedConvs,
        notifications: mappedNotifs,
        isLoading: false,
        error: null,
      });
      lastFetchTime = Date.now();
    } catch (err) {
      set((state) => ({
        ...state,
        isLoading: false,
        error: String(err),
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
      try {
        const threads = await frontendApi.getMessageThreads();
        set((state) => ({
          ...state,
          conversations: (threads as Conversation[]) ?? state.conversations,
        }));
      } catch {
        /* keep cached conversations */
      }
    },

    refetchConversations: async () => {
      const { isAuthenticated } = useAuth();
      if (!isAuthenticated) return;
      try {
        const raw = await conversationsApi.list();
        const rawConvs = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mappedConvs = mapConversationRowsFromApi(rawConvs);
        set((state) => ({ ...state, conversations: mappedConvs }));
      } catch {
        /* keep cached conversations */
      }
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
        const w = (await walletApi.getMe()) as Record<string, unknown>;
        const balance = Number(w.good_fund ?? w.walletBalance ?? 0) || 0;
        const pending = Number(w.pending_fund ?? w.pendingBalance ?? 0) || 0;
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
