/**
 * RFQ Service — Request for Quote API calls with mappers
 * Pattern: Request Type → API Call → Response → Mapper → Model
 */

import { httpClient } from '@/services/api/httpClient';
import { QueryTableRequest } from '@/types/api/request/query';
import { IRFQ, IQuotation, IPaginatedList } from '@/types/model/models';

export const fetchRFQs = async ({
  query,
}: {
  query: QueryTableRequest;
}): Promise<IPaginatedList<IRFQ>> => {
  try {
    const res = await httpClient.post<{
      data?: { items?: unknown[]; total?: number; page?: number; limit?: number };
    }>('/rfqs/list', { ...query });

    if (!res?.data) {
      throw new Error('Failed to fetch RFQs');
    }

    const data = res.data;
    return {
      items: (data.items || []) as IRFQ[],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      hasMore: (data.page || 1) * (data.limit || 20) < (data.total || 0),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get RFQ details
 */
export const getRFQDetail = async (rfqId: string | number): Promise<IRFQ> => {
  try {
    const res = await httpClient.get<Record<string, unknown>>(`/rfqs/${rfqId}`);

    if (!res) {
      throw new Error('Failed to fetch RFQ');
    }

    return {
      id: (res as any)?.rfq_id || (res as any)?.id || rfqId,
      title: (res as any)?.title || '',
      description: (res as any)?.description || (res as any)?.details,
      quantity: (res as any)?.quantity || 0,
      status: (res as any)?.status || 'open',
      createdAt: (res as any)?.created_at || '',
      deadline: (res as any)?.deadline_date || (res as any)?.required_delivery_date,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create new RFQ
 */
export const createRFQ = async (payload: Record<string, unknown>): Promise<IRFQ> => {
  try {
    const res = await httpClient.post<Record<string, unknown>>('/rfqs', payload);

    if (!res) {
      throw new Error('Failed to create RFQ');
    }

    return {
      id: (res as any)?.rfq_id || (res as any)?.id || '',
      title: (res as any)?.title || '',
      quantity: (res as any)?.quantity || 0,
      status: 'open',
      createdAt: (res as any)?.created_at || '',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch quotations for an RFQ
 */
export const fetchQuotations = async (rfqId: string | number): Promise<IQuotation[]> => {
  try {
    const res = await httpClient.get<unknown[]>(`/rfqs/${rfqId}/quotations`);

    if (!res || !Array.isArray(res)) {
      throw new Error('Failed to fetch quotations');
    }

    return res.map((quote: any) => ({
      id: quote.quote_id || quote.id || '',
      rfqId,
      factory: {
        id: quote.factory_id || '',
        name: quote.factory_name || '',
        rating: quote.factory_rating || 0,
        reviews: quote.factory_reviews || 0,
        isVerified: quote.factory_is_verified || false,
      },
      price: quote.price_per_piece || quote.price || 0,
      leadTime: quote.lead_time_days || quote.leadTime || 0,
      status: quote.status === 'AC' ? 'accepted' : quote.status === 'RJ' ? 'rejected' : 'pending',
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Accept a quotation
 */
export const acceptQuotation = async (quoteId: string | number): Promise<{ orderId: string }> => {
  try {
    const res = await httpClient.post<Record<string, unknown>>(`/quotations/${quoteId}/accept`, {});

    if (!res) {
      throw new Error('Failed to accept quotation');
    }

    return {
      orderId: (res as any)?.order_id || (res as any)?.id || '',
    };
  } catch (error) {
    throw error;
  }
};
