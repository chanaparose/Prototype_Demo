import { create } from 'zustand';
import { useAuth } from '@/stores/useAuthStore';
import {
  frontendApi,
  notificationsApi,
  conversationsApi,
  rfqsApi,
  walletApi,
} from '@/services/api';
import {
  normalizeFactoryRow,
  mapOrderStatusFromApi,
  guessOrderProgress,
  guessCategoryIcon,
  normalizeRfqRecord,
  mapConversationRowsFromApi,
} from '@/stores/utils';
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

    const normOrder = (r: Record<string, unknown>, rfqList?: Rfq[]): Order => {
      const rfqId = String(r.rfqId ?? r.rfq_id ?? '');
      const status = mapOrderStatusFromApi(String(r.status ?? 'PR'));
      const linkedRfq = rfqList?.find((q) => q.id === rfqId);
      return {
        id: String(r.order_id ?? r.id ?? ''),
        rfqId,
        factoryId: String(r.factoryId ?? r.factory_id ?? ''),
        factoryName: String(r.factoryName ?? r.factory_name ?? ''),
        projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
        category: String(r.category ?? '') || (linkedRfq?.category ?? ''),
        status,
        progress:
          Number(r.progress ?? 0) > 0 ? Number(r.progress ?? 0) : guessOrderProgress(status),
        totalAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
        depositPaid: Number(r.depositPaid ?? r.deposit_paid ?? r.deposit_amount ?? 0),
        quantity: Number(r.quantity ?? 0) || (linkedRfq?.quantity ?? 0),
        createdAt: String(r.createdAt ?? r.created_at ?? ''),
        estimatedDelivery: String(r.estimatedDelivery ?? r.estimated_delivery ?? ''),
        timeline: Array.isArray(r.timeline) ? (r.timeline as Order['timeline']) : [],
      };
    };

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

      console.info(
        '[DataStore] bootstrap:',
        bootstrapRes.status,
        '| notifs:',
        rawNotifs.length,
        '| convs:',
        rawConvs.length,
      );

      const factoryList: Factory[] = (() => {
        const raw = boot?.factories;
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[])
          .map((row) => normalizeFactoryRow(row))
          .filter((f) => f.id && f.name);
      })();

      const mappedRfqs: Rfq[] = (() => {
        const raw = boot?.rfqs;
        if (Array.isArray(raw) && raw.length > 0) {
          return (raw as Record<string, unknown>[])
            .map((row) => normalizeRfqRecord(row, factoryList, guessCategoryIcon))
            .filter((r) => r.id);
        }
        return [];
      })();

      const mappedOrders: Order[] = (() => {
        const raw = boot?.orders;
        if (Array.isArray(raw) && raw.length > 0) {
          return (raw as Record<string, unknown>[])
            .map((o) => normOrder(o, mappedRfqs))
            .filter((o) => o.id);
        }
        return [];
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
        rfqs: mappedRfqs,
        orders: mappedOrders,
        conversations: mappedConvs,
        notifications: mappedNotifs,
        isLoading: false,
        error: null,
      });
      lastFetchTime = Date.now();
    } catch (err) {
      console.error('DataStore fetchAll failed:', err);
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
      try {
        const data = await frontendApi.getBootstrap();
        const raw = data.rfqs;
        if (Array.isArray(raw) && raw.length > 0) {
          set((state) => {
            const mapped = (raw as Record<string, unknown>[])
              .map((row) => normalizeRfqRecord(row, state.factories, guessCategoryIcon))
              .filter((r) => r.id);
            return { ...state, rfqs: mapped };
          });
        }
      } catch (err) {
        console.error('Failed to refetch RFQs:', err);
      }
    },

    refetchRfq: async (id: string) => {
      try {
        const payload = (await frontendApi.getRfq(id)) as Record<string, unknown>;
        let quotes: unknown[] = [];
        try {
          const raw = await rfqsApi.listQuotations(id);
          if (Array.isArray(raw)) quotes = raw;
          else if (raw && typeof raw === 'object') {
            const o = raw as Record<string, unknown>;
            if (Array.isArray(o.data)) quotes = o.data;
            else if (Array.isArray(o.quotations)) quotes = o.quotations;
          }
        } catch {
          // some environments may not have this endpoint yet
        }
        const merged: Record<string, unknown> =
          quotes.length > 0 ? { ...payload, quotations: quotes } : payload;
        set((state) => {
          const mapped = normalizeRfqRecord(merged, state.factories, guessCategoryIcon);
          if (!mapped.id) return state;
          const exists = state.rfqs.some((r) => r.id === mapped.id);
          return {
            ...state,
            rfqs: exists
              ? state.rfqs.map((r) => (r.id === mapped.id ? mapped : r))
              : [mapped, ...state.rfqs],
          };
        });
      } catch (err) {
        console.error('Failed to refetch RFQ:', err);
      }
    },

    refetchOrders: async () => {
      try {
        const data = await frontendApi.getBootstrap();
        const rawOrders = data.orders;
        const rawRfqs = data.rfqs;
        if (Array.isArray(rawOrders) && rawOrders.length > 0) {
          set((state) => {
            const rfqList: Rfq[] = Array.isArray(rawRfqs)
              ? (rawRfqs as Record<string, unknown>[]).map((r) =>
                  normalizeRfqRecord(r, state.factories, guessCategoryIcon),
                )
              : [];
            const gp = (s: string, v: number) =>
              v > 0
                ? v
                : s === 'in_production'
                  ? 35
                  : s === 'shipped'
                    ? 85
                    : s === 'completed'
                      ? 100
                      : 0;
            const mapO = (r: Record<string, unknown>): Order => {
              const rfqId = String(r.rfqId ?? r.rfq_id ?? '');
              const status = String(r.status ?? 'in_production');
              const linked = rfqList.find((q) => q.id === rfqId);
              return {
                id: String(r.order_id ?? r.id ?? ''),
                rfqId,
                factoryId: String(r.factoryId ?? r.factory_id ?? ''),
                factoryName: String(r.factoryName ?? r.factory_name ?? ''),
                projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
                category: String(r.category ?? '') || (linked?.category ?? ''),
                status,
                progress: gp(status, Number(r.progress ?? 0)),
                totalAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
                depositPaid: Number(r.depositPaid ?? r.deposit_paid ?? r.deposit_amount ?? 0),
                quantity: Number(r.quantity ?? 0) || (linked?.quantity ?? 0),
                createdAt: String(r.createdAt ?? r.created_at ?? ''),
                estimatedDelivery: String(r.estimatedDelivery ?? r.estimated_delivery ?? ''),
                timeline: Array.isArray(r.timeline) ? (r.timeline as Order['timeline']) : [],
              };
            };
            const mapped = (rawOrders as Record<string, unknown>[]).map(mapO).filter((o) => o.id);
            return { ...state, orders: mapped };
          });
        }
      } catch (err) {
        console.error('Failed to refetch orders:', err);
      }
    },

    refetchMessages: async () => {
      try {
        const threads = await frontendApi.getMessageThreads();
        set((state) => ({
          ...state,
          conversations: (threads as Conversation[]) ?? state.conversations,
        }));
      } catch (err) {
        console.error('Failed to refetch messages:', err);
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
      } catch (err) {
        console.error('Failed to refetch conversations:', err);
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
      } catch (err) {
        console.error('Failed to refetch factory:', err);
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
      } catch (err) {
        console.error('Failed to refetch wallet:', err);
      }
    },
  };
});
