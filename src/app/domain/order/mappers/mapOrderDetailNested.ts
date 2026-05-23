import { nestedRecord, type ApiRecord } from '@/lib/apiShape';
import type { CustomerShippingInfo, OrderRfqSummary } from '@/domain/order/types';
import type { IQuoteNestedResponse, IRfqNestedResponse } from '@/types/api';

export function extractOrderRfqFromApi(order: ApiRecord): IRfqNestedResponse | null {
  const rfq = nestedRecord(order, 'rfq');
  if (!rfq.rfq_id && !rfq.title) return null;
  return rfq as unknown as IRfqNestedResponse;
}

export function extractOrderQuotationFromApi(order: ApiRecord): IQuoteNestedResponse | null {
  const quote = nestedRecord(order, 'quotation');
  if (!quote.quote_id && !quote.quotation_id) return null;
  return quote as unknown as IQuoteNestedResponse;
}

export function extractOrderRfqSummaryFromApi(order: ApiRecord): OrderRfqSummary | null {
  const rfq = nestedRecord(order, 'rfq');
  const q = Number(rfq.quantity);
  if (Number.isFinite(q) && q > 0) {
    return { quantity: q, unit_name: String(rfq.unit_name ?? 'ชิ้น') };
  }
  const legacy = Number(order.rfq_quantity ?? order.quantity);
  if (Number.isFinite(legacy) && legacy > 0) {
    return { quantity: legacy, unit_name: String(order.unit_name ?? 'ชิ้น') };
  }
  return null;
}

export function extractOrderShippingFromApi(order: ApiRecord): CustomerShippingInfo {
  const delivery = nestedRecord(order, 'delivery_address');
  const shipping = nestedRecord(order, 'shipping_address');
  const rfqAddr = nestedRecord(nestedRecord(order, 'rfq'), 'address');
  const addr =
    delivery.address_detail || delivery.address_line
      ? delivery
      : shipping.address_detail || shipping.address_line
        ? shipping
        : rfqAddr;

  const buyer = nestedRecord(order, 'buyer');
  const customer = nestedRecord(order, 'customer');
  const buyerRow = buyer.name || buyer.phone ? buyer : customer;

  return {
    recipientName:
      String(
        order.customer_name ??
          addr.recipient_name ??
          addr.name ??
          buyerRow.name ??
          order.buyer_name ??
          '',
      ).trim() || undefined,
    phone:
      String(
        order.customer_phone ?? addr.phone ?? addr.tel ?? buyerRow.phone ?? order.buyer_phone ?? '',
      ).trim() || undefined,
    addressLine:
      String(addr.address_detail ?? addr.address_line ?? addr.detail ?? '').trim() || undefined,
    subDistrict:
      String(addr.sub_district_name ?? addr.sub_district ?? addr.subdistrict ?? '').trim() ||
      undefined,
    district: String(addr.district_name ?? addr.district ?? '').trim() || undefined,
    province: String(addr.province_name ?? addr.province ?? '').trim() || undefined,
    postalCode: String(addr.zip_code ?? addr.postal_code ?? '').trim() || undefined,
  };
}
