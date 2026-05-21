import { type Rfq, type Order } from '@/stores/types';
import { meApi } from '@/services/api/meApi';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import { mapOrderStatusFromApi, guessOrderProgress } from '@/domain/order/status';

export type RfqListResult = { rfqs: Rfq[]; orders: Order[] };

export async function fetchAndMapRfqList(): Promise<RfqListResult> {
  const items = await meApi.listRFQOrders();
  if (!Array.isArray(items)) return { rfqs: [], orders: [] };

  const rfqs: Rfq[] = [];
  const orders: Order[] = [];

  for (const item of items) {
    const catName = item.category_name ?? '';
    const hasOrder = item.order_id != null;
    const status = mapRfqStatusFromApi(item.status, {
      quoteCount: item.quotation_count,
      hasAcceptedQuote: hasOrder,
    });
    rfqs.push({
      id: String(item.rfq_id),
      projectName: item.title,
      category: catName,
      categoryIcon: guessCategoryIcon(catName),
      status,
      offerCount: item.quotation_count,
      budget: item.target_price ?? 0,
      quantity: 0,
      material: '',
      deadline: '',
      createdAt: item.created_at ? item.created_at.split('T')[0] : '',
      description: '',
      imageUrls: [],
      offers: [],
    } as Rfq);

    if (hasOrder && item.order_id != null) {
      const orderStatus = mapOrderStatusFromApi(item.order_status ?? '');
      orders.push({
        id: String(item.order_id),
        rfqId: String(item.rfq_id),
        factoryId: String(item.factory_id ?? ''),
        factoryName: item.factory_name ?? '',
        projectName: item.title,
        category: catName,
        status: orderStatus,
        progress: guessOrderProgress(orderStatus),
        totalAmount: item.total_amount ?? 0,
        depositPaid: 0,
        quantity: 0,
        createdAt: item.order_created_at ? item.order_created_at.split('T')[0] : '',
        estimatedDelivery: item.estimated_delivery ?? '',
        timeline: [],
      } as Order);
    }
  }

  return { rfqs, orders };
}
