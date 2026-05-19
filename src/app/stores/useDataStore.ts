import { create } from 'zustand';
import { useAuthStore, useAuth } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { walletApi } from '@/services/api/userApi';
import { queryClient } from '@/lib/queryClient';
import { chatKeys, orderKeys, rfqKeys } from '@/lib/queryKeys';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { refreshConversationsCache } from '@/domain/chat/chatCache';
import { fetchNotificationsList } from '@/domain/notifications/queries/useNotificationQueries';
import { mapNotificationToBootstrapModel } from '@/domain/notifications/mappers/mapNotification';
import { normalizeFactoryRow } from '@/stores/utils';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import { mapOrderStatusFromApi, guessOrderProgress } from '@/domain/order/status';
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
        const categories: BootstrapCategoryModel[] = (() => {
          const raw = boot?.categories;
          if (!Array.isArray(raw) || raw.length === 0) return [];
          return (raw as Record<string, unknown>[]).map((c) => {
            const name = pickScalarString(c.name);
            return {
              id: pickScalarString(c.id, c.category_id),
              name,
              icon: pickScalarString(c.icon) || guessCategoryIcon(name),
              color: pickScalarString(c.color) || 'var(--brand-violet)',
            } as BootstrapCategoryModel;
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
      const [bootstrapRes, notifRes] = await Promise.allSettled([
        frontendApi.getBootstrap(),
        fetchNotificationsList(),
      ]);

      const boot = bootstrapRes.status === 'fulfilled' ? bootstrapRes.value : null;
      const notificationModels = notifRes.status === 'fulfilled' ? notifRes.value : [];

      const mappedNotifs: Notification[] = notificationModels.map(
        mapNotificationToBootstrapModel,
      );

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
                id: pickScalarString(u.id),
                name: pickScalarString(u.name),
                nameEn: u.nameEn != null ? pickScalarString(u.nameEn) : undefined,
                avatar: pickScalarString(u.avatar),
                company: pickScalarString(u.company),
                email: pickScalarString(u.email),
                phone: pickScalarString(u.phone),
                walletBalance: pickScalarNumber(u.walletBalance) ?? 0,
                pendingBalance: pickScalarNumber(u.pendingBalance) ?? 0,
                memberSince: pickScalarString(u.memberSince),
              } as CurrentUser;
            })()
          : null,
        categories: (() => {
          const raw = boot?.categories;
          if (Array.isArray(raw) && raw.length > 0) {
            return (raw as Record<string, unknown>[]).map((c) => {
              const name = pickScalarString(c.name);
              return {
                id: pickScalarString(c.id, c.category_id),
                name,
                icon: pickScalarString(c.icon) || guessCategoryIcon(name),
                color: pickScalarString(c.color) || 'var(--brand-violet)',
              } as BootstrapCategoryModel;
            });
          }
          return [];
        })(),
        factories: factoryList,
        factoryProfiles: [],
        factoryReviews: [],
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: (() => {
          const raw = boot?.rfqs;
          if (!Array.isArray(raw)) return [];
          return (raw as Record<string, unknown>[]).map((r) => {
            const category = pickScalarString(r.category);
            const offerCount = pickScalarNumber(r.offerCount ?? r.offer_count) ?? 0;
            const statusCode = pickScalarString(r.status);
            const status = mapRfqStatusFromApi(statusCode, { quoteCount: offerCount });
            return {
              id: String(r.id ?? r.rfq_id ?? ''),
              projectName: pickScalarString(r.projectName ?? r.project_name),
              category,
              categoryIcon: guessCategoryIcon(category),
              status,
              offerCount,
              budget: pickScalarNumber(r.budget) ?? 0,
              quantity: pickScalarNumber(r.quantity) ?? 0,
              material: '',
              deadline: '',
              createdAt: pickScalarString(r.createdAt ?? r.created_at),
              description: pickScalarString(r.description),
              imageUrls: [],
              offers: [],
            } as Rfq;
          });
        })(),
        orders: (() => {
          const raw = boot?.orders;
          if (!Array.isArray(raw)) return [];
          return (raw as Record<string, unknown>[]).map((o) => {
            const status = mapOrderStatusFromApi(pickScalarString(o.status));
            return {
              id: String(o.id ?? o.order_id ?? ''),
              rfqId: String(o.rfqId ?? o.rfq_id ?? ''),
              factoryId: String(o.factoryId ?? o.factory_id ?? ''),
              factoryName: pickScalarString(o.factoryName ?? o.factory_name),
              projectName: pickScalarString(o.projectName ?? o.project_name),
              category: pickScalarString(o.category),
              status,
              progress: guessOrderProgress(status),
              totalAmount: pickScalarNumber(o.totalAmount ?? o.total_amount) ?? 0,
              depositPaid: pickScalarNumber(o.depositPaid ?? o.deposit_paid) ?? 0,
              quantity: pickScalarNumber(o.quantity) ?? 0,
              createdAt: pickScalarString(o.createdAt ?? o.created_at),
              estimatedDelivery: pickScalarString(o.estimatedDelivery ?? o.estimated_delivery) || '',
              timeline: [],
            } as Order;
          });
        })(),
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
