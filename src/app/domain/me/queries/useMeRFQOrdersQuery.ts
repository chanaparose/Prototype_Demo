/**
 * useMeRFQOrdersQuery
 *
 * Fetches the unified /api/v1/me/rfq-orders endpoint and maps the response
 * into the existing Rfq[] and Order[] UI models so all existing components
 * work without modification.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { meKeys } from '@/lib/queryKeys';
import { meApi, type IMeRFQOrderSummary } from '@/services/api/meApi';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import {
  mapOrderStatusFromApi,
  guessOrderProgressFromStep,
  parseCurrentStepId,
} from '@/domain/order/status';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import type { Rfq, Order } from '@/stores/types';

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapSummaryList(
  items: IMeRFQOrderSummary[],
  factoryMap: Map<string, string>,
): { rfqs: Rfq[]; orders: Order[] } {
  const rfqs: Rfq[] = [];
  const orders: Order[] = [];

  for (const item of items) {
    const catName = item.category_name ?? '';
    const hasOrder = item.order_id != null;
    const hasAcceptedQuote = hasOrder;

    const status = mapRfqStatusFromApi(item.status, {
      quoteCount: item.quotation_count,
      hasAcceptedQuote,
    });

    const createdAt = item.created_at ? item.created_at.split('T')[0] : '';

    rfqs.push({
      id: String(item.rfq_id),
      projectName: item.title,
      category: catName,
      categoryIcon: guessCategoryIcon(catName),
      status,
      offerCount: item.quotation_count,
      budget: 0,
      quantity: 0,
      material: '',
      deadline: '',
      createdAt,
      description: '',
      imageUrls: [],
      offers: [],
    });

    if (hasOrder && item.order_id != null && item.order_status != null) {
      const orderStatus = mapOrderStatusFromApi(item.order_status);
      const currentStepId = parseCurrentStepId(
        item.production_current_step_id ?? item.current_step_id,
      );
      orders.push({
        id: String(item.order_id),
        rfqId: String(item.rfq_id),
        factoryId: String(item.factory_id ?? ''),
        factoryName:
          item.factory_name ??
          (item.factory_id != null ? factoryMap.get(String(item.factory_id)) : undefined) ??
          '',
        projectName: item.title,
        category: catName,
        status: orderStatus,
        progress: guessOrderProgressFromStep(currentStepId, orderStatus),
        totalAmount: item.total_amount ?? 0,
        depositPaid: 0,
        quantity: 0,
        createdAt: item.order_created_at?.split('T')[0] ?? createdAt,
        estimatedDelivery: item.estimated_delivery?.split('T')[0] ?? '',
        timeline: [],
        currentStepId,
      });
    }
  }

  return { rfqs, orders };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

type MeRFQOrdersData = {
  rfqs: Rfq[];
  orders: Order[];
};

// Factory names come from the /me/rfq-orders payload itself; the store's factory
// list was always empty here, so an empty fallback map is behavior-preserving.
const EMPTY_FACTORY_MAP = new Map<string, string>();

export function useMeRFQOrdersQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery<MeRFQOrdersData>({
    queryKey: meKeys.rfqOrders(),
    queryFn: async () => {
      const items = await meApi.listRFQOrders();
      if (!Array.isArray(items)) return { rfqs: [], orders: [] };
      return mapSummaryList(items, EMPTY_FACTORY_MAP);
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
