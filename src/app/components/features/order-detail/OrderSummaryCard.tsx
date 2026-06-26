import React from 'react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { Image } from '@/components/ui/image';
import { getOrderProgressMeta } from '@/components/features/order-detail/orderProgressMeta';

export type OrderSummary = {
  id: string;
  projectName: string;
  factoryName: string;
  status: string;
  progress: number;
  totalAmount: number;
  quantity?: number;
  estimatedDelivery: string;
  currentStepId?: number;
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
  orderId?: string;
};

export function OrderSummaryCard({
  order,
  rfqSummary,
  relatedFactory,
  statusLabelTh,
  orderId,
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
      className='relative overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6 2xl:p-7'
      style={{ background: 'linear-gradient(135deg, var(--brand-navy-deep) 0%, #4A267D 100%)' }}
    >
      <div className='absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 bg-white' />
      <div className='relative z-10'>
        {orderId ? (
          <p className='mb-4 truncate text-[13px] font-semibold leading-tight text-white/90'>
            <span className='text-white/75'>คำสั่งซื้อ</span>
            <span className='mx-1 font-normal text-white/40'>·</span>
            <span className='font-semibold text-white'>OD-{orderId}</span>
          </p>
        ) : null}
        <div className='mb-3 flex items-start justify-between gap-3 lg:mb-4'>
          <div className='flex min-w-0 flex-1 items-center gap-3'>
            {relatedFactory?.image && (
              <Image
                src={relatedFactory.image}
                alt=''
                className='w-12 h-12 rounded-xl object-cover shrink-0'
              />
            )}
            <div className='min-w-0 space-y-0.5'>
              <p className='truncate text-[10px] text-white/80'>{order.factoryName}</p>
              <p className='truncate text-sm text-white' style={{ fontWeight: 700 }}>
                {order.projectName}
              </p>
            </div>
          </div>
          <span
            className='shrink-0 rounded-full px-2.5 py-1 text-[10px]'
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'var(--neutral-white)',
              fontWeight: 600,
            }}
          >
            {badgeLabel}
          </span>
        </div>
        <div className='mb-3 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 lg:mb-4 lg:px-4 lg:py-3'>
          {(() => {
            const stepInfo = getOrderProgressMeta(order);
            const StepIcon = stepInfo.icon;
            return (
              <>
                <StepIcon size={14} className='shrink-0 text-white/80' />
                <span className='text-xs font-semibold text-white flex-1'>
                  {stepInfo.label}
                </span>
                 
              </>
            );
          })()}
        </div>
        <div className='grid grid-cols-3 gap-2 rounded-xl bg-white/10 p-2.5 lg:p-4'>
          <div className='min-w-0 lg:px-1'>
            <p className='truncate text-sm text-white' style={{ fontWeight: 700 }}>
              {formatCurrency(order.totalAmount)}
            </p>
            <p className='text-[10px] text-white/70'>มูลค่ารวม</p>
          </div>
          <div className='min-w-0 border-l border-white/20 pl-2 lg:pl-4'>
            <p className='truncate text-sm text-white' style={{ fontWeight: 700 }}>
              {qtyText}
            </p>
            <p className='text-[10px] text-white/70'>จำนวน</p>
          </div>
          <div className='min-w-0 border-l border-white/20 pl-2 lg:pl-4'>
            <p className='truncate text-sm text-white' style={{ fontWeight: 700 }}>
              {formatDateTh(order.estimatedDelivery)}
            </p>
            <p className='text-[10px] text-white/70'>กำหนดส่ง</p>
          </div>
        </div>
      </div>
    </div>
  );
}
