import { type Rfq, type Order } from '@/stores/types';
import { frontendApi } from '@/services/api/exploreApi';
import type { ISessionResponse } from '@/services/api/types/explore.types';
import { apiListAsRecords } from '@/lib/apiShape';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import {
  mapOrderStatusFromApi,
  guessOrderProgressFromStep,
  parseCurrentStepId,
} from '@/domain/order/status';
import { useSessionStore } from '@/stores/useSessionStore';

export type RfqListResult = { rfqs: Rfq[]; orders: Order[] };

const SESSION_RFQ_STALE_MS = 30_000;

export function mapRfqListFromBootstrap(
  bootstrap: Pick<ISessionResponse, 'rfqs' | 'orders'> | null | undefined,
): RfqListResult {
  const rfqsRaw = apiListAsRecords(bootstrap?.rfqs);

  const rfqs: Rfq[] = rfqsRaw.map((r) => {
    const category = String(r.category ?? r.category_name ?? '');
    const offerCount = Number(r.offerCount ?? r.offer_count ?? 0);
    const status = mapRfqStatusFromApi(String(r.status ?? ''), { quoteCount: offerCount });
    return {
      id: String(r.id ?? r.rfq_id ?? ''),
      projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
      category,
      categoryIcon: guessCategoryIcon(category),
      status,
      offerCount,
      budget: Number(r.budget ?? r.target_price ?? 0),
      quantity: Number(r.quantity ?? 0),
      material: '',
      deadline: '',
      createdAt: String(r.createdAt ?? r.created_at ?? '').split('T')[0],
      description: String(r.description ?? ''),
      imageUrls: Array.isArray(r.images) ? (r.images as string[]) : [],
      offers: [],
    };
  });

  const ordersRaw = apiListAsRecords(bootstrap?.orders);

  const orders: Order[] = ordersRaw.map((o) => {
    const status = mapOrderStatusFromApi(String(o.status ?? ''));
    const currentStepId = parseCurrentStepId(o.currentStepId ?? o.current_step_id);
    return {
      id: String(o.id ?? o.order_id ?? ''),
      rfqId: String(o.rfqId ?? o.rfq_id ?? ''),
      factoryId: String(o.factoryId ?? o.factory_id ?? ''),
      factoryName: String(o.factoryName ?? o.factory_name ?? ''),
      projectName: String(o.projectName ?? o.project_name ?? o.title ?? ''),
      category: String(o.category ?? ''),
      status,
      progress: guessOrderProgressFromStep(currentStepId, status),
      totalAmount: Number(o.totalAmount ?? o.total_amount ?? 0),
      depositPaid: Number(o.depositPaid ?? o.deposit_paid ?? 0),
      quantity: Number(o.quantity ?? 0),
      createdAt: String(o.createdAt ?? o.created_at ?? '').split('T')[0],
      estimatedDelivery: String(o.estimatedDelivery ?? o.estimated_delivery ?? ''),
      timeline: [],
      currentStepId,
    };
  });

  return { rfqs, orders };
}

export async function fetchAndMapRfqList(options?: { fresh?: boolean }): Promise<RfqListResult> {
  if (!options?.fresh) {
    const { data: session, lastFetchedAt } = useSessionStore.getState();
    if (
      session &&
      lastFetchedAt != null &&
      Date.now() - lastFetchedAt < SESSION_RFQ_STALE_MS
    ) {
      return mapRfqListFromBootstrap(session);
    }
  }

  const bootstrap = await frontendApi.getBootstrap();
  return mapRfqListFromBootstrap(bootstrap);
}
