/**
 * Unified /me endpoints — designed to reduce multiple round trips for the
 * /orders (rfq-and-orders) page.
 */
import { httpClient } from '@/services/api/httpClient';

// ── Response types ────────────────────────────────────────────────────────────

export interface IMeRFQOrderSummary {
  rfq_id: number;
  title: string;
  request_kind: string;
  status: string;
  created_at: string;
  category_name: string | null;
  quotation_count: number;
  // Optional – only present when an order exists for this RFQ
  order_id?: number | null;
  order_status?: string | null;
  total_amount?: number | null;
}

export interface IMeQuotationSummary {
  quote_id: number;
  factory_name: string;
  grand_total: number;
  status: string;
  created_at: string;
}

export interface IMeOrderSummary {
  order_id: number;
  order_status: string;
  total_amount: number;
  created_at: string;
}

export interface IMeRFQOrderDetail {
  rfq_id: number;
  title: string;
  request_kind: string;
  status: string;
  created_at: string;
  category_name: string | null;
  quantity: number;
  details?: string | null;
  target_price?: number | null;
  target_lead_time_days?: number | null;
  quotations: IMeQuotationSummary[];
  order?: IMeOrderSummary | null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const meApi = {
  /**
   * GET /api/v1/me/rfq-orders
   * Returns the current user's RFQs, each enriched with quotation count and
   * order info (if any), in a single round trip.
   */
  listRFQOrders: () => httpClient.get<IMeRFQOrderSummary[]>('/me/rfq-orders'),

  /**
   * GET /api/v1/me/rfq-orders/:rfq_id
   * Returns full detail for one RFQ: RFQ data + quotation list + order (if any).
   */
  getRFQOrderDetail: (rfqId: string | number) =>
    httpClient.get<IMeRFQOrderDetail>(`/me/rfq-orders/${rfqId}`),
};
