import { type Rfq } from '@/stores/types';
import { rfqsApi } from '@/services/api/rfqApi';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';

type RawRfq = {
  rfq_id: number;
  category_id: number;
  title: string;
  quantity: number;
  details?: string;
  description?: string;
  target_price?: number;
  budget_total?: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

type RawQuotation = {
  quote_id: number;
  factory_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
  status: string;
  [key: string]: unknown;
};

export async function fetchAndMapRfqList(
  categoryMap: Map<string, string>,
  factoryMap: Map<string, string>,
): Promise<Rfq[]> {
  const rawList = await rfqsApi.list();
  if (!Array.isArray(rawList)) return [];

  const withQuotes = await Promise.all(
    (rawList as RawRfq[]).map(async (r) => {
      let quotes: RawQuotation[] = [];
      try {
        const q = await rfqsApi.getQuotations(r.rfq_id);
        if (Array.isArray(q)) {
          quotes = q as RawQuotation[];
        } else if (q && typeof q === 'object') {
          const obj = q as Record<string, unknown>;
          const nested = obj.quotations ?? obj.data ?? obj.items ?? obj.results;
          if (Array.isArray(nested)) quotes = nested as RawQuotation[];
        }
      } catch {
        /* no quotes */
      }
      return { raw: r, quotes };
    }),
  );

  return withQuotes.map(({ raw, quotes }) => {
    const catName = categoryMap.get(String(raw.category_id)) ?? '';
    const totalBudget = Number(
      raw.target_price ??
        raw.budget_total ??
        (raw as Record<string, unknown>).total_budget ??
        0,
    );
    const legacyBudgetPerPiece = Number((raw as Record<string, unknown>).budget_per_piece ?? 0);
    const budget = Math.round(
      (Number.isFinite(totalBudget) && totalBudget > 0 ? totalBudget : 0) ||
        (legacyBudgetPerPiece > 0 && raw.quantity > 0 ? legacyBudgetPerPiece * raw.quantity : 0),
    );
    const hasAccepted = quotes.some((q) => String(q.status ?? '').toUpperCase() === 'AC');
    const status = mapRfqStatusFromApi(raw.status, {
      quoteCount: quotes.length,
      hasAcceptedQuote: hasAccepted,
    });
    const createdDate = raw.created_at ? raw.created_at.split('T')[0] : '';

    return {
      id: String(raw.rfq_id),
      projectName: raw.title,
      category: catName,
      categoryIcon: guessCategoryIcon(catName),
      status,
      offerCount: quotes.length,
      budget,
      quantity: raw.quantity,
      material: '',
      deadline: '',
      createdAt: createdDate,
      description: String(raw.details ?? raw.description ?? ''),
      offers: quotes.map((q) => ({
        id: String(q.quote_id),
        factoryId: String(q.factory_id),
        factoryName: factoryMap.get(String(q.factory_id)) ?? `โรงงาน #${q.factory_id}`,
        price: Math.round(q.price_per_piece * raw.quantity + (q.mold_cost ?? 0)),
        leadTime: q.lead_time_days,
        rating: 0,
        verified: true,
        recommended: false,
        aiReason: '',
        completedOrders: 0,
        responseTime: '',
        quoteStatus: String(q.status ?? '').toUpperCase(),
      })),
    };
  });
}
