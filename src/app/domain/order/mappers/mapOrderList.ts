import { type Order, type Rfq } from '@/stores/types';
import { ordersApi } from '@/services/api/ordersApi';
import {
  mapOrderStatusFromApi,
  guessOrderProgressFromStep,
  parseCurrentStepId,
} from '@/domain/order/status';

type RawOrder = {
  order_id: number;
  quote_id: number;
  factory_id: number;
  total_amount: number;
  deposit_amount: number;
  status: string;
  estimated_delivery?: string;
  created_at: string;
  current_step_id?: number;
  currentStepId?: number;
};

export async function fetchAndMapOrderList(
  factoryMap: Map<string, string>,
  rfqs: Rfq[],
): Promise<Order[]> {
  const rawList = await ordersApi.list();
  if (!Array.isArray(rawList)) return [];

  return (rawList as RawOrder[]).map((raw) => {
    const status = mapOrderStatusFromApi(String(raw.status ?? ''));
    const fName = factoryMap.get(String(raw.factory_id)) ?? `โรงงาน #${raw.factory_id}`;
    const deliveryDate = raw.estimated_delivery ? String(raw.estimated_delivery).split('T')[0] : '';
    const createdDate = raw.created_at ? raw.created_at.split('T')[0] : '';

    let projectName = '';
    let category = '';
    let rfqId = '';
    let quantity = 0;
    for (const rfq of rfqs) {
      const matchOffer = rfq.offers.find((o) => String(o.id) === String(raw.quote_id));
      if (matchOffer) {
        projectName = rfq.projectName;
        category = rfq.category;
        rfqId = rfq.id;
        quantity = rfq.quantity;
        break;
      }
    }

    const currentStepId = parseCurrentStepId(raw.currentStepId ?? raw.current_step_id);

    return {
      id: String(raw.order_id),
      rfqId,
      factoryId: String(raw.factory_id),
      factoryName: fName,
      projectName: projectName || `คำสั่งซื้อ #${raw.order_id}`,
      category,
      status,
      progress: guessOrderProgressFromStep(currentStepId, status),
      totalAmount: raw.total_amount ?? 0,
      depositPaid: raw.deposit_amount ?? 0,
      quantity,
      createdAt: createdDate,
      estimatedDelivery: deliveryDate,
      timeline: [],
      currentStepId,
    };
  });
}
