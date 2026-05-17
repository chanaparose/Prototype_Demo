/**
 * Order Response Mappers — Transform order API responses to models
 */

import { IOrder } from '@/types/model';
import { createMapper } from '@/services/mapper/response/index';

/**
 * Raw order data from API
 */
interface OrderResponse {
  order_id?: string | number;
  id?: string | number;
  quote_id?: string | number;
  quotation_id?: string | number;
  rfq_id?: string | number;
  total_amount?: number;
  totalAmount?: number;
  status: string;
  created_at?: string;
  createdAt?: string;
  rfq?: Record<string, unknown>;
  quotation?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Map API order response to model
 */
export const mapOrderResponse = createMapper<OrderResponse, IOrder>((data) => {
  const rfqData = data.rfq as any;
  const quotationData = data.quotation as any;

  return {
    id: data.order_id || data.id || '',
    rfq: rfqData
      ? {
          id: data.rfq_id || rfqData.id || '',
          title: rfqData.title || '',
          status: rfqData.status || 'open',
          quantity: rfqData.quantity || 0,
          createdAt: rfqData.created_at || '',
        }
      : undefined,
    quotation: quotationData
      ? {
          id: data.quotation_id || quotationData.id || '',
          rfqId: data.rfq_id || '',
          factory: {
            id: quotationData.factory_id || '',
            name: quotationData.factory_name || '',
            rating: quotationData.factory_rating || 0,
            reviews: quotationData.factory_reviews || 0,
            isVerified: quotationData.factory_is_verified || false,
          },
          price: quotationData.price_per_piece || quotationData.price || 0,
          leadTime: quotationData.lead_time_days || quotationData.leadTime || 0,
          status:
            quotationData.status === 'AC'
              ? 'accepted'
              : quotationData.status === 'RJ'
                ? 'rejected'
                : 'pending',
        }
      : undefined,
    status: data.status || '',
    totalAmount: data.total_amount || data.totalAmount || 0,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
});
