import React, { useState } from 'react';
import { CheckCircle, Factory } from 'lucide-react';
import type { IQuoteNestedResponse } from '@/types/api';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { CollapsibleCard } from '@/shared/ui/cards/CollapsibleCard';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { openImageLightbox } from '@/stores/useLightboxStore';

interface Props {
  quotation: IQuoteNestedResponse;
  factoryName?: string;
}

const fmt = (n: number) => formatCurrency(n, 'THB').replace('฿', '').trim();

const paymentTermsLabel: Record<string, string> = {
  lc_at_sight: 'ชำระเต็ม 100% ก่อนผลิต',
  full_payment: 'ชำระเต็ม 100%',
  '50_50': 'แบ่งชำระ 50/50',
  '30_70': 'แบ่งชำระ 30/70',
  net_30: 'Net 30 วัน',
};

export function OrderBOQCard({ quotation, factoryName }: Props) {
  const [open, setOpen] = useState(true);

  if (!quotation) return null;

  const q = quotation as IQuoteNestedResponse & Record<string, unknown>;
  const subtotal = Number(q.subtotal ?? 0);
  const shippingCost = Number(q.shipping_cost ?? 0);
  const packagingCost = Number(q.packaging_cost ?? 0);
  const toolingMoldCost = Number(q.tooling_mold_cost ?? q.mold_cost ?? 0);
  const discountAmount = Number(q.discount_amount ?? 0);
  const vatRate = Number(q.vat_rate ?? 0);
  const vatAmount = Number(q.vat_amount ?? 0);
  const grandTotal = Number(q.grand_total ?? 0);
  const validityDays = Number(q.validity_days ?? 0);
  const validUntil = String(q.valid_until ?? '').split('T')[0];
  const paymentTerms = String(q.payment_terms ?? '');
  const paymentLabel = paymentTermsLabel[paymentTerms] ?? paymentTerms;

  const imageUrls: string[] = Array.isArray(q.image_urls)
    ? q.image_urls.filter((u) => typeof u === 'string' && u.trim())
    : [];

  return (
    <CollapsibleCard
      defaultOpen={open}
      onOpenChange={setOpen}
      header={
        <div className='flex items-center gap-2'>
          <span className='text-sm font-bold text-gray-900'>ใบเสนอราคา BOQ</span>
          <StatusBadge variant='success' size='sm'>
            <CheckCircle size={10} /> ยอมรับแล้ว
          </StatusBadge>
        </div>
      }
      className='mb-3 rounded-2xl border border-gray-100 bg-white overflow-hidden'
    >
      <div className='space-y-4 lg:space-y-5'>
        <div className='flex items-center gap-2.5 pt-2'>
          <div className='w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-base shrink-0'>
            <Factory size={17} className='text-violet-600' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-gray-900 truncate'>
              {factoryName ?? 'โรงงาน'}
            </p>
            
          </div>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
          {[
            {
              label: 'ราคาต่อชิ้น',
              value: `฿${fmt(Number(q.price_per_piece ?? 0))}`,
              accent: true,
            },
            { label: 'Lead time (วัน)', value: String(q.lead_time_days ?? '-'), accent: false },
            { label: 'ค่าสินค้ารวม (ก่อน VAT)', value: `฿${fmt(subtotal)}`, accent: false },
            {
              label: 'อายุใบเสนอ',
              value: validityDays > 0 ? `${validityDays} วัน` : '-',
              accent: false,
            },
          ].map((tile) => (
            <div key={tile.label} className='bg-gray-50 rounded-xl p-2.5 text-center'>
              <p
                className='text-sm font-bold'
                style={{ color: tile.accent ? 'var(--brand-mauve)' : 'var(--brand-navy)' }}
              >
                {tile.value}
              </p>
              <p className='text-[9px] text-gray-500 mt-0.5'>{tile.label}</p>
            </div>
          ))}
        </div>

        <div className='rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3 space-y-1.5'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2'>
            รายละเอียดค่าใช้จ่าย
          </p>

          <Row label='ค่าสินค้ารวม' value={`฿${fmt(subtotal)}`} />
          {shippingCost > 0 && <Row label='ค่าขนส่ง' value={`฿${fmt(shippingCost)}`} />}
          {packagingCost > 0 && <Row label='ค่าบรรจุภัณฑ์' value={`฿${fmt(packagingCost)}`} />}
          {toolingMoldCost > 0 && (
            <Row label='ค่าแม่พิมพ์ / Tooling' value={`฿${fmt(toolingMoldCost)}`} />
          )}
          {discountAmount > 0 && (
            <Row label='ส่วนลด' value={`-฿${fmt(discountAmount)}`} valueColor='text-emerald-600' />
          )}

          <div className='border-t border-gray-200 pt-1.5 mt-1'>
            <Row label={`VAT ${vatRate > 0 ? `${vatRate}%` : ''}`} value={`฿${fmt(vatAmount)}`} />
          </div>

          <div className='border-t border-gray-200 pt-1.5 mt-1'>
            <Row
              label='รวมทั้งหมด (Grand total)'
              value={`฿${fmt(grandTotal)}`}
              bold
              valueColor='text-brand-mauve'
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2 text-xs'>
          {paymentLabel && (
            <div className='rounded-xl bg-violet-50 px-3 py-2'>
              <p className='text-[9px] text-gray-400 mb-0.5'>เงื่อนไขชำระเงิน</p>
              <p className='font-semibold text-violet-800'>{paymentLabel}</p>
            </div>
          )}
          {validUntil && (
            <div className='rounded-xl bg-gray-50 px-3 py-2'>
              <p className='text-[9px] text-gray-400 mb-0.5'>ใบเสนอราคาถึง</p>
              <p className='font-semibold text-gray-800'>{validUntil}</p>
            </div>
          )}
        </div>

        {imageUrls.length > 0 && (
          <div>
            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2'>
              รูปประกอบใบเสนอราคา
            </p>
            <div className='grid grid-cols-3 gap-2'>
              {imageUrls.map((url) => (
                <Button
                  key={url}
                  variant='unstyled'
                  type='button'
                  onClick={() => openImageLightbox(url)}
                  className='aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none active:opacity-80'
                  aria-label='ดูรูปขนาดใหญ่'
                >
                  <Image src={url} alt='' className='w-full h-full object-cover' />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  valueColor?: string;
}) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <span className={`text-[11px] ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-[11px] ${bold ? 'font-bold' : 'font-semibold'} ${
          valueColor ?? (muted ? 'text-gray-500' : 'text-brand-navy')
        }`}
      >
        {value}
      </span>
    </div>
  );
}
