import { type Rfq } from '@/stores/types';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import {
  ACCENT_ORANGE,
  ACCENT_ORANGE_DEEP,
  PROGRESS_COMPLETED,
  PROGRESS_GRADIENT_ACTIVE,
  type OrderFilterId,
  type RfqFilterId,
} from '@/components/features/rfq-and-orders/constants';
import { isPendingPaymentStatus } from '@/domain/order/status';

export type OrderTagCounts = {
  pendingPayment: number;
  inProduction: number;
  shipped: number;
  completed: number;
  disputed: number;
  cancelledExpired: number;
};

export function getRfqActivityCounts(rfq: Rfq) {
  const offers = rfq.offers ?? [];
  const totalOffers = offers.length || rfq.offerCount || 0;
  // When offers array is populated (e.g. RFQ detail page), compute from it.
  // When it's empty (e.g. bootstrap list), use the pre-aggregated counts from BE.
  const accepted =
    offers.length > 0
      ? offers.filter((o) => o.quoteStatus === 'AC').length
      : (rfq.acceptedCount ?? 0);
  const pending =
    offers.length > 0
      ? offers.filter((o) => o.quoteStatus === 'PD').length
      : (rfq.pendingCount ?? 0);
  return { totalOffers, accepted, pending };
}

export function getOrderTabCount(id: OrderFilterId, counts: OrderTagCounts): number {
  switch (id) {
    case 'pending_payment':
      return counts.pendingPayment;
    case 'in_production':
      return counts.inProduction;
    case 'shipped':
      return counts.shipped;
    case 'completed':
      return counts.completed;
    case 'disputed':
      return counts.disputed;
    case 'cancelled_expired':
      return counts.cancelledExpired;
    default:
      return 0;
  }
}

export function getOrderProgressBg(status: string): string {
  if (status === 'completed') return PROGRESS_COMPLETED;
  if (status === 'shipped') return ACCENT_ORANGE;
  if (isPendingPaymentStatus(status)) return ACCENT_ORANGE_DEEP;
  return PROGRESS_GRADIENT_ACTIVE;
}

export function formatBudget(n: number): string {
  return formatCurrency(n);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function getRfqFilterId(status: string): RfqFilterId | null {
  const u = status.toUpperCase();
  if (u === 'OP' || status === 'pending') return 'pending';
  if (
    u === 'OFFERS_RECEIVED' ||
    u === 'REVIEWING' ||
    status === 'offers_received' ||
    status === 'reviewing'
  ) {
    return 'has_quote';
  }
  if (u === 'CC' || status === 'cancelled' || status === 'expired') return 'cancelled_expired';
  if (u === 'CL' || status === 'completed') return null;
  return null;
}
