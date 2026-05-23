import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/stores/useDataStore';
import { walletApi } from '@/services/api/userApi';
import { type Order } from '@/stores/types';
import type {
  ProductionLockContext,
  ProductionUpdatesBundle,
} from '@/components/features/production/types';
import {
  mapOrderStatusFromApi,
  guessOrderProgressFromStep,
  deriveCurrentStepIdFromProductionUpdates,
  parseCurrentStepId,
} from '@/domain/order/status';
import { orderKeys, walletKeys } from '@/lib/queryKeys';
import { useOrderDetailQuery } from '@/hooks/order-detail/useOrderDetailQuery';
import { mapProductionUpdatesBundleFromApi } from '@/domain/production/mappers/mapProductionBundle';
import type { IProductionUpdatesBundleResponse } from '@/services/api/types/production.types';
import {
  getOrderUiMode,
  type LockReason,
  type OrderUiMode,
} from '@/pages/order-detail/getOrderUiMode';
import {
  buildFallbackLockContext,
  normalizeLockReason,
  orderStatusLabelTh,
  parseNextAction,
  parsePaymentSchedule,
  type NextAction,
  type PaymentScheduleItem,
} from '@/pages/order-detail/orderDetailFromApi';
import type { IQuoteNestedResponse, IRfqNestedResponse } from '@/types/api';
function unwrapOrderPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const inner = r.order;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return r;
}

function mapApiOrderToOrder(
  row: Record<string, unknown>,
  factories: { id: string; name: string }[],
  opts?: {
    currentStepId?: number;
    productionUpdates?: { step_id: number; status: string }[];
  },
): Order {
  const fid = String(row.factory_id ?? '');
  const st = mapOrderStatusFromApi(String(row.status ?? ''));
  const fName = factories.find((f) => f.id === fid)?.name ?? `โรงงาน #${fid}`;
  const rfqObj =
    row.rfq && typeof row.rfq === 'object' && !Array.isArray(row.rfq)
      ? (row.rfq as Record<string, unknown>)
      : null;
  const currentStepId =
    opts?.currentStepId ??
    parseCurrentStepId(row.current_step_id ?? row.currentStepId) ??
    deriveCurrentStepIdFromProductionUpdates(opts?.productionUpdates);
  return {
    id: String(row.order_id ?? row.id ?? ''),
    rfqId: String(row.rfq_id ?? ''),
    factoryId: fid,
    factoryName: fName,
    projectName: String(
      rfqObj?.title ?? row.project_name ?? row.title ?? `คำสั่งซื้อ #${row.order_id ?? row.id}`,
    ),
    category: '',
    status: st,
    progress: guessOrderProgressFromStep(currentStepId, st),
    totalAmount: Number(row.total_amount ?? 0),
    depositPaid: Number(row.total_amount ?? row.deposit_amount ?? 0),
    quantity: Number(row.quantity ?? 0),
    createdAt: String(row.created_at ?? '').split('T')[0] ?? '',
    estimatedDelivery: String(row.estimated_delivery ?? '').split('T')[0] ?? '',
    timeline: [],
    currentStepId,
  };
}

export type RfqSummaryInfo = {
  quantity: number;
  unit_name: string;
};

export type ReviewStateData = {
  order_id: number;
  factory_id: number;
  factory_name: string;
  eligible: boolean;
  already_reviewed: boolean;
  reason?: string;
  review?: {
    review_id: number;
    rating: number;
    comment: string;
    image_urls?: string[];
    created_at?: string;
    updated_at?: string;
  } | null;
};

export type OrderDetailContextValue = {
  orderId: string;
  mappedOrder: Order;
  apiStatus: string;
  statusLabelTh: string;
  uiMode: OrderUiMode;
  nextAction: NextAction | null;
  paymentSchedule: PaymentScheduleItem[];
  production: ProductionUpdatesBundle;
  isProductionLoading: boolean;
  isProductionError: boolean;
  productionError: unknown;
  effectiveProductionLocked: boolean;
  effectiveLockReason: LockReason;
  lockContextMerged: ProductionLockContext;
  reviewState: ReviewStateData | null;

  rfqSummary: RfqSummaryInfo | null;
  rfq: IRfqNestedResponse | null;
  quotation: IQuoteNestedResponse | null;
  refetchAll: () => Promise<void>;
};

function extractRfqSummary(row: Record<string, unknown>): RfqSummaryInfo | null {
  const rfq = row.rfq;
  if (rfq && typeof rfq === 'object') {
    const r = rfq as Record<string, unknown>;
    const q = Number(r.quantity);
    if (Number.isFinite(q) && q > 0) {
      return { quantity: q, unit_name: String(r.unit_name ?? 'ชิ้น') };
    }
  }
  // Legacy flat-row fallback: some BE versions expose rfq_quantity / quantity at top level.
  const legacy = Number(row.rfq_quantity ?? row.quantity);
  if (Number.isFinite(legacy) && legacy > 0) {
    return { quantity: legacy, unit_name: String(row.unit_name ?? 'ชิ้น') };
  }
  return null;
}

const OrderDetailContext = createContext<OrderDetailContextValue | null>(null);

export function useOrderDetail(): OrderDetailContextValue {
  const ctx = useContext(OrderDetailContext);
  if (!ctx) throw new Error('useOrderDetail must be used within OrderDetailProvider');
  return ctx;
}

type ProviderProps = {
  orderId: string;
  factories: { id: string; name: string }[];
  children: ReactNode;
};

export function OrderDetailProvider({ orderId, factories, children }: ProviderProps) {
  const orderQ = useOrderDetailQuery(orderId);
  const qc = useQueryClient();

  // Prefetch wallet so DepositPaymentModal shows balance immediately (no loading flash)
  useQuery({
    queryKey: walletKeys.me(),
    queryFn: () => walletApi.getMe(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const { refetchWallet, refetchRfqs } = useData();

  const refetchAll = useCallback(async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: orderKeys.detail(orderId) }),
      refetchRfqs(),
      refetchWallet(),
    ]);
  }, [qc, orderId, refetchRfqs, refetchWallet]);

  const value = useMemo((): OrderDetailContextValue | null => {
    if (!orderQ.data) return null;
    const row = unwrapOrderPayload(orderQ.data);
    const apiStatus = String(row.status ?? '').toUpperCase();
    const uiMode = getOrderUiMode(apiStatus);
    const paymentSchedule = parsePaymentSchedule(row);
    const nextAction = parseNextAction(row, orderId, apiStatus);
    const statusLabelTh = orderStatusLabelTh(
      apiStatus,
      row.status_label_th != null ? String(row.status_label_th) : undefined,
    );

    // Extract production from embedded response (GET /orders/:id now includes it).
    const rawProd = row.production;
    const production: ProductionUpdatesBundle =
      rawProd && typeof rawProd === 'object'
        ? mapProductionUpdatesBundleFromApi(rawProd as IProductionUpdatesBundleResponse)
        : ({
            order_id: Number(orderId) || 0,
            order_status: apiStatus,
            updates: [],
          } as ProductionUpdatesBundle);

    // Extract review_state from embedded response.
    const rawReview = row.review_state;
    const reviewState: ReviewStateData | null =
      rawReview && typeof rawReview === 'object'
        ? (rawReview as ReviewStateData)
        : null;

    const mappedOrder = mapApiOrderToOrder(row, factories, {
      productionUpdates: production.updates,
    });
    const payableAmount = (() => {
      const staged = paymentSchedule.find(
        (s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT',
      )?.amount;
      if (Number.isFinite(staged) && Number(staged) > 0) return Number(staged);
      if (
        nextAction?.amount != null &&
        Number.isFinite(nextAction.amount) &&
        nextAction.amount > 0
      ) {
        return nextAction.amount;
      }
      return mappedOrder.totalAmount;
    })();
    const apiLocked =
      production.production_locked === true
        ? true
        : production.production_locked === false
          ? false
          : undefined;
    const effectiveProductionLocked = apiLocked ?? uiMode.productionLocked;
    const effectiveLockReason: LockReason = normalizeLockReason(production.lock_reason, apiStatus);

    let lockContextMerged = { ...(production.lock_context ?? {}) };
    if (effectiveProductionLocked && Object.keys(lockContextMerged).length === 0) {
      lockContextMerged = {
        ...lockContextMerged,
        ...buildFallbackLockContext(orderId, row, paymentSchedule),
      };
    }
    if (effectiveProductionLocked && !lockContextMerged.payment_url && nextAction?.cta_url) {
      lockContextMerged = { ...lockContextMerged, payment_url: nextAction.cta_url };
    }
    if (effectiveProductionLocked) {
      lockContextMerged = { ...lockContextMerged, deposit_amount: payableAmount };
    }
    if (effectiveProductionLocked && !lockContextMerged.deposit_due_date && nextAction?.due_date) {
      lockContextMerged = { ...lockContextMerged, deposit_due_date: nextAction.due_date };
    }

    return {
      orderId,
      mappedOrder,
      apiStatus,
      statusLabelTh,
      uiMode,
      nextAction,
      paymentSchedule,
      production,
      isProductionLoading: orderQ.isLoading,
      isProductionError: orderQ.isError,
      productionError: orderQ.error,
      effectiveProductionLocked,
      effectiveLockReason,
      lockContextMerged,
      reviewState,
      rfqSummary: extractRfqSummary(row),
      rfq:
        row.rfq && typeof row.rfq === 'object' && !Array.isArray(row.rfq)
          ? (row.rfq as IRfqNestedResponse)
          : null,
      quotation:
        row.quotation && typeof row.quotation === 'object' && !Array.isArray(row.quotation)
          ? (row.quotation as IQuoteNestedResponse)
          : null,
      refetchAll,
    };
  }, [orderQ.data, factories, orderId]);

  if (orderQ.isPending && !orderQ.data) {
    return (
      <div className='min-h-[40vh] flex flex-col items-center justify-center px-4'>
        <div
          className='w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mb-3'
          style={{ borderColor: 'var(--brand-purple)', borderTopColor: 'transparent' }}
        />
        <p className='text-sm text-gray-500'>กำลังโหลดคำสั่งซื้อ…</p>
      </div>
    );
  }

  if (orderQ.isError || !value) {
    return (
      <div className='min-h-[40vh] flex flex-col items-center justify-center px-4'>
        <p className='text-sm text-gray-500 mb-4 text-center'>ไม่พบคำสั่งซื้อจากระบบ</p>
        <Link
          to='/orders'
          className='px-6 py-3 rounded-xl text-white font-semibold text-center inline-block'
          style={{ background: 'var(--brand-purple)' }}
        >
          กลับไปรายการคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  return <OrderDetailContext.Provider value={value}>{children}</OrderDetailContext.Provider>;
}
