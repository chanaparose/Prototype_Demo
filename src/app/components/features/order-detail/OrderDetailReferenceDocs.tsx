import React, { useEffect, useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import type { IRfqNestedResponse, IQuoteNestedResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Button } from '@/components/ui/button';
import { RfqReferenceCard } from '@/components/features/order-detail/RfqReferenceCard';
import { pickScalarNumber } from '@/utils/pickScalarString';
import { RfqOfferDetailSheet } from '@/components/features/rfq-detail/RfqOfferDetailSheet';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import type { Quotation } from '@/components/features/rfq-detail/QuotationBOQCard';
import { rfqsApi } from '@/services/api/rfqApi';

type Props = {
  quotation?: IQuoteNestedResponse | null;
  rfq?: IRfqNestedResponse | null;
  factoryName?: string;
  factoryId?: string | number;
  rfqId?: string;
};

export function OrderDetailReferenceDocs({ quotation, rfq, factoryName, factoryId, rfqId }: Props) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [enrichedQuotation, setEnrichedQuotation] = useState<OrderQuoteLike | null>(null);
  const effectiveRfqId = firstNonEmptyString(rfqId, rfq?.rfq_id);

  useEffect(() => {
    setEnrichedQuotation(null);
  }, [quotation?.quote_id]);

  useEffect(() => {
    if (!quoteOpen || !quotation?.quote_id || !effectiveRfqId) return;

    let cancelled = false;

    void rfqsApi
      .getQuotations(effectiveRfqId)
      .then((res) => {
        const payload = res as unknown;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { quotations?: unknown }).quotations)
            ? (payload as { quotations: unknown[] }).quotations
            : [];
        const matched = rows.find((row) => {
          const q = row as Record<string, unknown>;
          return String(q.quote_id ?? q.quotation_id ?? '') === String(quotation.quote_id);
        }) as OrderQuoteLike | undefined;

        if (!cancelled && matched) {
          setEnrichedQuotation({ ...(quotation as OrderQuoteLike), ...matched });
        }
      })
      .catch(() => {
        if (!cancelled) setEnrichedQuotation(null);
      });

    return () => {
      cancelled = true;
    };
  }, [quoteOpen, quotation, effectiveRfqId]);

  if (!quotation && !rfq) return null;

  const quoteSource = enrichedQuotation ?? quotation;
  const grandTotal = quotation?.grand_total ?? 0;
  const rfqQty = rfq ? Math.max(0, pickScalarNumber(rfq.quantity) ?? 0) : 0;
  const rfqUnit = rfq?.unit_name ?? 'ชิ้น';
  const offerForSheet = quoteSource
    ? mapOrderQuotationToOffer({
        quotation: quoteSource,
        rfq,
        factoryName,
        factoryId,
      })
    : null;

  return (
    <>
      <section className='rounded-xl border border-slate-200/80 bg-white p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <FileText size={16} className='text-slate-400' aria-hidden />
          <p className='text-sm font-bold text-brand-navy-ink'>เอกสารอ้างอิง</p>
        </div>

        {quotation ? (
          <p className='text-xs text-slate-600 leading-relaxed'>
            ใบเสนอราคา {factoryName ?? 'โรงงาน'} · รวม {formatCurrency(grandTotal)}
          </p>
        ) : null}
        {rfq ? (
          <p className='text-xs text-slate-600 leading-relaxed'>
            สเปก RFQ{effectiveRfqId ? ` #${effectiveRfqId}` : ''}
            {rfqQty > 0 ? ` · ${rfqQty.toLocaleString('th-TH')} ${rfqUnit}` : ''}
          </p>
        ) : null}

        <div className='flex flex-wrap gap-2'>
          {quotation ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setQuoteOpen(true)}
              className='inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-brand-navy-ink'
            >
              ดูใบเสนอราคา
              <ChevronRight size={14} className='text-slate-400' aria-hidden />
            </Button>
          ) : null}
          {rfq ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setRfqOpen(true)}
              className='inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-brand-navy-ink'
            >
              ดูสเปก RFQ
              <ChevronRight size={14} className='text-slate-400' aria-hidden />
            </Button>
          ) : null}
        </div>
      </section>

      {offerForSheet ? (
        <RfqOfferDetailSheet
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          offer={offerForSheet}
          rfqQuantity={rfqQty}
          rfqUnitName={rfqUnit}
          rfqStatus='closed'
          isRequestClosed
          acceptingId={null}
          hideFooterActions
          hideQuotationHistory
        />
      ) : null}

      {rfq ? (
        <AppSheetDialog
          open={rfqOpen}
          onOpenChange={setRfqOpen}
          title='รายละเอียดใบขอราคา (RFQ)'
          bodyClassName='p-4 max-h-[75vh]'
        >
          <RfqReferenceCard rfq={rfq} bare />
        </AppSheetDialog>
      ) : null}
    </>
  );
}

function mapOrderQuotationToOffer({
  quotation,
  rfq,
  factoryName,
  factoryId,
}: {
  quotation: OrderQuoteLike;
  rfq?: IRfqNestedResponse | null;
  factoryName?: string;
  factoryId?: string | number;
}): OfferItem {
  const q = quotation;
  const quoteId = String(q.quote_id ?? '');
  const leadTime = Number(q.lead_time_days ?? 0);
  const grandTotal = Number(q.grand_total ?? 0);
  const pricePerPiece = Number(q.price_per_piece ?? 0);
  const offeredQty = firstPositiveNumber(q.factory_qty, q.moq, q.factory_moq, rfq?.quantity);
  const offeredUnit =
    firstNonEmptyString(q.factory_unit_name, q.unit_name, q.unit_name_th, rfq?.unit_name) ?? null;

  return {
    id: quoteId,
    factoryName: factoryName || String(q.factory_name ?? 'โรงงาน'),
    factoryId: factoryId != null ? String(factoryId) : String(q.factory_id ?? ''),
    price: grandTotal > 0 ? grandTotal : pricePerPiece,
    leadTime,
    responseTime: '',
    rating: Number(q.rating ?? q.factory_rating ?? 0),
    completedOrders: Number(q.completed_orders ?? q.factory_completed_orders ?? 0),
    verified: Boolean(q.verified ?? q.factory_verified ?? false),
    quoteStatus: 'AC',
    factoryHighlight: String(q.factory_highlight ?? q.factory_note ?? '').trim(),
    quotationDetail: {
      quote_id: Number(q.quote_id ?? 0),
      factory_name: factoryName || String(q.factory_name ?? 'โรงงาน'),
      price_per_piece: pricePerPiece,
      mold_cost: Number(q.mold_cost ?? 0),
      moq: offeredQty,
      lead_time_days: leadTime,
      shipping_method: String(q.shipping_method ?? q.shipping_method_name ?? 'ตามที่ตกลงกับโรงงาน'),
      material_detail: String(q.material_detail ?? ''),
      payment_condition: String(q.payment_condition ?? q.payment_terms ?? ''),
      sample_cost: Number(q.sample_cost ?? 0),
      valid_until: String(q.valid_until ?? ''),
      validity_days: Number(q.validity_days ?? 0),
      certifications: Array.isArray(q.certifications) ? q.certifications : [],
      subtotal: Number(q.subtotal ?? 0),
      discount_amount: Number(q.discount_amount ?? 0),
      shipping_cost: Number(q.shipping_cost ?? 0),
      packaging_cost: Number(q.packaging_cost ?? 0),
      tooling_mold_cost: Number(q.tooling_mold_cost ?? q.mold_cost ?? 0),
      vat_rate: Number(q.vat_rate ?? 0),
      vat_amount: Number(q.vat_amount ?? 0),
      grand_total: grandTotal,
      platform_commission_rate: Number(q.platform_commission_rate ?? 0),
      platform_commission_amount: Number(q.platform_commission_amount ?? 0),
      factory_net_receivable: Number(q.factory_net_receivable ?? 0),
      image_urls: Array.isArray(q.image_urls)
        ? q.image_urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        : [],
      factory_qty: offeredQty > 0 ? offeredQty : null,
      factory_unit_id: q.factory_unit_id != null ? Number(q.factory_unit_id) : null,
      factory_unit_name: offeredUnit,
    },
  };
}

/** Order nested quote + optional RFQ-list enrichment fields (nullables differ from Quotation). */
type OrderQuoteLike = Omit<IQuoteNestedResponse, 'valid_until'> &
  Partial<Omit<Quotation, 'valid_until'>> & {
    valid_until?: string | null;
    factory_id?: number | string;
    factory_name?: string;
    factory_qty?: number | null;
    factory_moq?: number | null;
    factory_unit_id?: number | null;
    factory_unit_name?: string | null;
    unit_name?: string | null;
    unit_name_th?: string | null;
    shipping_method?: string | null;
    shipping_method_name?: string | null;
    material_detail?: string | null;
    payment_condition?: string | null;
    sample_cost?: number | null;
    rating?: number | null;
    factory_rating?: number | null;
    completed_orders?: number | null;
    factory_completed_orders?: number | null;
    verified?: boolean | null;
    factory_verified?: boolean | null;
    certifications?: string[];
    platform_commission_rate?: number | null;
    platform_commission_amount?: number | null;
    factory_net_receivable?: number | null;
  };

function firstPositiveNumber(...values: unknown[]): number {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}
