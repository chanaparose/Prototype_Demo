import React from 'react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { Image } from '@/components/ui/image';

export type OrderSummary = {
  id: string;
  projectName: string;
  factoryName: string;
  status: string;
  progress: number;
  totalAmount: number;
  /** @deprecated — prefer passing `rfqSummary.quantity` derived from order.rfq */
  quantity?: number;
  estimatedDelivery: string;
};

type FactoryInfo = {
  image?: string;
};

/** Canonical quantity source — comes from `order.rfq` on the enriched payload. */
export type RfqSummary = {
  quantity: number;
  unit_name: string;
};

const STATUS_CONFIG: Record<string, { label: string }> = {
  pending_payment: { label: 'รอชำระเงิน' },
  in_production: { label: 'กำลังผลิต' },
  shipped: { label: 'จัดส่งแล้ว' },
  completed: { label: 'เสร็จสิ้น' },
};

type OrderSummaryCardProps = {
  order: OrderSummary;
  /** RFQ-derived summary (quantity + unit). Prefer this over legacy order.quantity. */
  rfqSummary?: RfqSummary | null;
  relatedFactory?: FactoryInfo | null;
  /** API-driven label (e.g. หมดกำหนดชำระ for PE) — never show raw codes like PP/PE */
  statusLabelTh?: string;
};

export function OrderSummaryCard({
  order,
  rfqSummary,
  relatedFactory,
  statusLabelTh,
}: OrderSummaryCardProps) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
  const badgeLabel = statusLabelTh?.trim() || cfg.label;

  // Quantity resolution: prefer rfqSummary (BE-enriched), fall back to legacy order.quantity
  // (kept during the rollout window — remove once all call sites migrate).
  const legacyQty =
    typeof order.quantity === 'number' && Number.isFinite(order.quantity) && order.quantity > 0
      ? order.quantity
      : null;
  const qty = rfqSummary?.quantity ?? legacyQty;
  const unit = rfqSummary?.unit_name ?? 'ชิ้น';
  const qtyText = qty != null ? `${formatCompactNumber(qty)} ${unit}` : '—';

  return (
    <div
      className='rounded-2xl p-4 relative overflow-hidden'
      style={{ background: 'linear-gradient(135deg, var(--brand-navy-deep) 0%, #4A267D 100%)' }}
    >
      <div className='absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 bg-white' />
      <div className='relative z-10'>
        <div className='flex items-center justify-between mb-3 gap-3'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {relatedFactory?.image && (
              <Image
                src={relatedFactory.image}
                alt=''
                className='w-12 h-12 rounded-xl object-cover shrink-0'
              />
            )}
            <div className='min-w-0'>
              <p className='text-white/80 text-[10px] truncate'>{order.factoryName}</p>
              <p className='text-white truncate' style={{ fontWeight: 700 }}>
                {order.projectName}
              </p>
            </div>
          </div>
          <span
            className='px-2.5 py-1 rounded-full text-[10px]'
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'var(--neutral-white)',
              fontWeight: 600,
            }}
          >
            {badgeLabel}
          </span>
        </div>
        <div className='space-y-1.5 mb-3'>
          <div className='flex justify-between text-xs text-white/80'>
            <span>ความคืบหน้า</span>
            <span style={{ fontWeight: 700, color: 'var(--neutral-white)' }}>
              {order.progress}%
            </span>
          </div>
          <div className='h-2 bg-white/30 rounded-full overflow-hidden'>
            <div
              className='h-full bg-white rounded-full transition-all'
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>
        <div className='flex gap-4'>
          <div>
            <p className='text-white text-sm' style={{ fontWeight: 700 }}>
              {formatCurrency(order.totalAmount)}
            </p>
            <p className='text-white/70 text-[10px]'>มูลค่ารวม</p>
          </div>
          <div className='w-px bg-white/30' />
          <div>
            <p className='text-white text-sm' style={{ fontWeight: 700 }}>
              {qtyText}
            </p>
            <p className='text-white/70 text-[10px]'>จำนวน</p>
          </div>
          <div className='w-px bg-white/30' />
          <div>
            <p className='text-white text-sm' style={{ fontWeight: 700 }}>
              {formatDateTh(order.estimatedDelivery)}
            </p>
            <p className='text-white/70 text-[10px]'>กำหนดส่ง</p>
          </div>
        </div>
      </div>
    </div>
  );
}
