import React from 'react';
import { IncotermSelect } from '@/shared/ui/IncotermSelect';
import { PaymentTermsSelect } from '@/shared/ui/PaymentTermsSelect';
import { Input } from '@/components/ui/input';

type Props = {
  lead_time_days?: number;
  incoterms?: 'EXW' | 'FOB' | 'CIF' | 'DDP';
  payment_terms?: '50_50' | '30_70' | 'net_30' | 'lc_at_sight';
  validity_days?: number;
  onChange: (next: Partial<Props>) => void;
};

export function CommercialTermsForm({
  lead_time_days,
  incoterms,
  payment_terms,
  validity_days,
  onChange,
}: Props) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-4 space-y-3'>
      <p className='text-sm font-bold text-gray-900'>Commercial terms</p>
      <Input
        type='number'
        value={lead_time_days ?? ''}
        onChange={(e) => onChange({ lead_time_days: Number(e.target.value) || undefined })}
        placeholder='Lead time (days)'
        className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
      <IncotermSelect value={incoterms} onChange={(v) => onChange({ incoterms: v })} />
      <PaymentTermsSelect value={payment_terms} onChange={(v) => onChange({ payment_terms: v })} />
      <Input
        type='number'
        value={validity_days ?? ''}
        onChange={(e) => onChange({ validity_days: Number(e.target.value) || undefined })}
        placeholder='Validity (days)'
        className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
    </div>
  );
}
