import React, { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import type { IRfqNestedResponse, IQuoteNestedResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Button } from '@/components/ui/button';
import { OrderBOQCard } from '@/components/features/order-detail/OrderBOQCard';
import { RfqReferenceCard } from '@/components/features/order-detail/RfqReferenceCard';
import { pickScalarNumber } from '@/utils/pickScalarString';

type Props = {
  quotation?: IQuoteNestedResponse | null;
  rfq?: IRfqNestedResponse | null;
  factoryName?: string;
  factoryId?: string | number;
  rfqId?: string;
};

export function OrderDetailReferenceDocs({
  quotation,
  rfq,
  factoryName,
  factoryId,
  rfqId,
}: Props) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);

  if (!quotation && !rfq) return null;

  const grandTotal = quotation ? Number((quotation as Record<string, unknown>).grand_total ?? 0) : 0;
  const rfqData = rfq as unknown as Record<string, unknown> | undefined;
  const rfqQty = rfqData ? Math.max(0, pickScalarNumber(rfqData.quantity, rfq?.quantity) ?? 0) : 0;
  const rfqUnit = String(rfqData?.unit_name ?? rfq?.unit_name ?? 'ชิ้น');

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
            สเปก RFQ{rfqId ? ` #${rfqId}` : ''}
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

      {quotation ? (
        <AppSheetDialog
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          title='ใบเสนอราคา BOQ'
          bodyClassName='p-4 max-h-[75vh]'
        >
          <OrderBOQCard
            quotation={quotation}
            factoryName={factoryName}
            factoryId={factoryId}
            bare
          />
        </AppSheetDialog>
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
