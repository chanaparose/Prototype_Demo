import { type Rfq } from '@/stores/types';
import { meApi } from '@/services/api/meApi';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';

export async function fetchAndMapRfqList(): Promise<Rfq[]> {
  const items = await meApi.listRFQOrders();
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const catName = item.category_name ?? '';
    const hasOrder = item.order_id != null;
    const status = mapRfqStatusFromApi(item.status, {
      quoteCount: item.quotation_count,
      hasAcceptedQuote: hasOrder,
    });
    return {
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
      createdAt: item.created_at ? item.created_at.split('T')[0] : '',
      description: '',
      imageUrls: [],
      offers: [],
    } as Rfq;
  });
}
