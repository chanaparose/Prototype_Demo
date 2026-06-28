import type { Quotation } from '@/components/features/rfq-detail/QuotationBOQCard';
import { quotationFromOfferSource } from '@/components/features/rfq-detail/QuotationBOQCard';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type OfferMetrics = {
  offer: OfferItem;
  boq: Quotation;
  isAccepted: boolean;
  isRejected: boolean;
  isExpired: boolean;
  shippingCost: number;
  packagingCost: number;
  toolingMoldCost: number;
  discountAmount: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  unitLabel: string;
};

export function computeOfferMetrics(offer: OfferItem, rfqQuantity: number, rfqUnitName?: string): OfferMetrics {
  const qSt = (offer.quoteStatus ?? 'PD').toUpperCase();
  const isAccepted = qSt === 'AC';
  const isRejected = qSt === 'RJ';
  const isExpired =
    qSt === 'EX' ||
    (() => {
      if (isAccepted) return false;
      const vu = offer.quotationDetail?.valid_until;
      if (!vu) return false;
      const d = new Date(vu);
      return !Number.isNaN(d.getTime()) && d < new Date();
    })();

  const boq = quotationFromOfferSource(offer, rfqQuantity);
  const qd = (offer.quotationDetail ?? {}) as Partial<Quotation> & Record<string, unknown>;
  const shippingCost = asNumber(qd.shipping_cost);
  const packagingCost = asNumber(qd.packaging_cost);
  const toolingMoldCost = asNumber(qd.tooling_mold_cost ?? qd.mold_cost ?? boq.mold_cost);
  const discountAmount = asNumber(qd.discount_amount);
  const subtotal =
    asNumber(qd.subtotal) > 0
      ? asNumber(qd.subtotal)
      : Math.max(0, boq.price_per_piece * (rfqQuantity > 0 ? rfqQuantity : boq.moq));
  const vatRate = asNumber(qd.vat_rate);
  const vatAmount = asNumber(qd.vat_amount);
  const grandTotal =
    asNumber(qd.grand_total) > 0
      ? asNumber(qd.grand_total)
      : Math.max(
          0,
          subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost + vatAmount,
        );

  return {
    offer,
    boq,
    isAccepted,
    isRejected,
    isExpired,
    shippingCost,
    packagingCost,
    toolingMoldCost,
    discountAmount,
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    unitLabel: boq.factory_unit_name || rfqUnitName || 'หน่วย',
  };
}

export function formatQuoteValidUntil(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T12:00:00'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function minPositive(values: number[]): number | null {
  const filtered = values.filter((v) => v > 0);
  if (!filtered.length) return null;
  return Math.min(...filtered);
}
