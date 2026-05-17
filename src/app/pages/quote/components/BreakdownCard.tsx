import React from 'react';
import { MoneyText } from '@/shared/ui/MoneyText';
import type { IPlatformConfigResponse } from '@/services/api/types/admin.types';
import type { IQuotationBreakdown } from '@/services/api/types/rfq.types';
import { pickScalarString } from '@/utils/pickScalarString';

function resolveCurrencyCode(platformConfig?: IPlatformConfigResponse | null): string {
  const code = pickScalarString(platformConfig?.currency_code);
  return code || 'THB';
}

type Props = {
  loading: boolean;
  breakdown: IQuotationBreakdown | null;
  platformConfig?: IPlatformConfigResponse | null;
};

function Row({ label, value, currency }: Readonly<{ label: string; value: number; currency: string }>) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-gray-500'>{label}</span>
      <MoneyText value={value} currencyCode={currency} />
    </div>
  );
}

export function BreakdownCard({ loading, breakdown, platformConfig }: Readonly<Props>) {
  const ccy = resolveCurrencyCode(platformConfig);
  if (loading) {
    return (
      <div
        role='status'
        aria-live='polite'
        className='rounded-2xl border border-gray-100 bg-white p-4'
      >
        <p className='text-sm text-gray-400'>กำลังคำนวณ breakdown...</p>
      </div>
    );
  }
  if (!breakdown) return null;
  return (
    <div
      role='status'
      aria-live='polite'
      className='rounded-2xl border border-gray-100 bg-white p-4 space-y-2 sticky bottom-4'
    >
      <p className='text-sm font-bold text-gray-900'>Summary</p>
      <Row label='Subtotal' value={breakdown.subtotal} currency={ccy} />
      <Row label='Shipping' value={breakdown.shipping_cost} currency={ccy} />
      <Row label='Packaging' value={breakdown.packaging_cost} currency={ccy} />
      <Row label='Tooling (one-time)' value={breakdown.tooling_mold_cost} currency={ccy} />
      <hr />
      <Row label={`VAT ${breakdown.vat_rate}%`} value={breakdown.vat_amount} currency={ccy} />
      <Row label='Grand Total' value={breakdown.grand_total} currency={ccy} />
      <hr />
      <div className='flex items-center gap-2 justify-between text-sm'>
        <span className='text-gray-600'>
          Platform Commission {breakdown.platform_commission_rate}%
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded'>
            หักจาก Subtotal เท่านั้น
          </span>
          <MoneyText value={-breakdown.platform_commission_amount} currencyCode={ccy} />
        </span>
      </div>
      <div className='flex items-center justify-between font-semibold'>
        <span>You receive</span>
        <MoneyText value={breakdown.factory_net_receivable} currencyCode={ccy} />
      </div>
    </div>
  );
}
