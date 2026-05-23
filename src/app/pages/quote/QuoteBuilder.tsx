import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { quotationApi } from '@/services/api/rfqApi';
import { useQuoteBuilder } from '@/pages/quote/useQuoteBuilder';
import { usePreviewBreakdown } from '@/pages/quote/usePreviewBreakdown';
import { RFQReferencePanel } from '@/pages/quote/components/RFQReferencePanel';
import { LineItemTable } from '@/pages/quote/components/LineItemTable';
import { ExtraChargesForm } from '@/pages/quote/components/ExtraChargesForm';
import { CommercialTermsForm } from '@/pages/quote/components/CommercialTermsForm';
import { BreakdownCard } from '@/pages/quote/components/BreakdownCard';
import { Button } from '@/components/ui/button';
import { useAppMutation } from '@/hooks/useAppMutation';

export function QuoteBuilder() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const rid = Number(rfqId ?? 0);
  const { state, setPartial } = useQuoteBuilder(rid);
  const { loading, error, breakdown } = usePreviewBreakdown(state);
  const submitMutation = useAppMutation({
    mutationFn: () => quotationApi.create(state),
    onSuccess: (q) => {
      const id = Number(q.quote_id ?? 0);
      if (id > 0) navigate(`/factory/quotations/${id}`);
    },
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className='max-w-7xl mx-auto px-4 py-5'>
      <div className='grid lg:grid-cols-5 gap-4'>
        <div className='lg:col-span-2'>
          <RFQReferencePanel rfqId={rid} />
        </div>
        <div className='lg:col-span-3 space-y-4'>
          <LineItemTable items={state.items} onChange={(items) => setPartial({ items })} />
          <ExtraChargesForm
            discount_amount={state.discount_amount ?? 0}
            shipping_cost={state.shipping_cost ?? 0}
            packaging_cost={state.packaging_cost ?? 0}
            tooling_mold_cost={state.tooling_mold_cost ?? 0}
            onChange={(next) => setPartial(next)}
          />
          <CommercialTermsForm
            lead_time_days={state.lead_time_days}
            incoterms={state.incoterms}
            payment_terms={state.payment_terms}
            validity_days={state.validity_days}
            onChange={(next) => setPartial(next)}
          />
          <BreakdownCard loading={loading} breakdown={breakdown} />
          <Button
            variant='unstyled'
            type='button'
            disabled={submitMutation.isPending}
            onClick={() => void submitMutation.mutate()}
            className='w-full py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 disabled:opacity-50'
          >
            {submitMutation.isPending ? 'กำลังบันทึก...' : 'Create quotation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
