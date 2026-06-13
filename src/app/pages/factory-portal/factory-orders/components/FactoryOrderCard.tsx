import React from 'react';
import { Link } from 'react-router';
import {
  Ban,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ScanSearch,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { Button } from '@/components/ui/button';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import { factoryButtonClass, factoryCardClass } from '@/pages/factory-portal/factoryUi';
import type {
  DerivedCardState,
  FactoryOrderRow,
} from '@/pages/factory-portal/factory-orders/types';

export const REQUEST_KIND_LABEL: Record<string, { label: string; tone: FactoryStatusTone }> = {
  PR: { label: 'ผลิต OEM', tone: 'brand' },
  MR: { label: 'วัตถุดิบ', tone: 'info' },
  PS: { label: 'ตัวอย่างสินค้า', tone: 'warning' },
  MS: { label: 'ตัวอย่างวัตถุดิบ', tone: 'teal' },
};

const DEFAULT_STATUS_CONFIG = {
  label: 'ไม่ทราบสถานะ',
  tone: 'neutral',
  icon: Clock3,
} as const;

const STATUS_CONFIG: Record<string, { label: string; tone: FactoryStatusTone; icon: LucideIcon }> =
  {
    WS: { label: 'รอแนบสลีป', tone: 'warning', icon: Clock3 },
    WA: { label: 'รอยืนยันสลีป', tone: 'warning', icon: ScanSearch },
    PP: { label: 'รอชำระมัดจำ', tone: 'warning', icon: Clock3 },
    PE: { label: 'หมดกำหนดชำระ', tone: 'danger', icon: Ban },
    PD: { label: 'ชำระมัดจำแล้ว', tone: 'teal', icon: CircleDollarSign },
    PR: { label: 'กำลังผลิต', tone: 'brand', icon: Settings },
    QC: { label: 'ตรวจสอบคุณภาพ', tone: 'brand', icon: ScanSearch },
    SH: { label: 'จัดส่งแล้ว', tone: 'info', icon: PackageCheck },
    CP: { label: 'เสร็จสิ้น', tone: 'success', icon: Check },
    CN: { label: 'ยกเลิก', tone: 'neutral', icon: Ban },
    CC: { label: 'ยกเลิก', tone: 'neutral', icon: Ban },
    CL: { label: 'ยกเลิก', tone: 'neutral', icon: Ban },
  };

export function FactoryOrderCard({
  row,
  derived,
  onPrimaryCta,
}: {
  row: FactoryOrderRow;
  derived: DerivedCardState;
  onPrimaryCta: (row: FactoryOrderRow, cta: DerivedCardState['primaryCta']) => void;
}) {
  const statusCfg = STATUS_CONFIG[row.status] ?? DEFAULT_STATUS_CONFIG;
  const StatusIcon = statusCfg.icon;
  const requestKind = row.request_kind ? REQUEST_KIND_LABEL[row.request_kind] : null;
  return (
    <article className={factoryCardClass({ variant: 'list', className: 'min-w-0 sm:p-4' })}>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <p className='font-semibold text-gray-900 text-sm leading-snug truncate'>
            {row.rfq?.title ?? `Order #${row.order_id}`}
          </p>
          <div className='flex items-center gap-1.5 mt-0.5'>
            <p className='text-[11px] text-gray-400'>Order #{row.order_id}</p>
            {requestKind ? (
              <FactoryStatusBadge tone={requestKind.tone}>{requestKind.label}</FactoryStatusBadge>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap justify-end gap-1'>
          <FactoryStatusBadge tone={statusCfg.tone} className='gap-1 py-1'>
            <StatusIcon size={11} aria-hidden />
            {statusCfg.label}
          </FactoryStatusBadge>
          {derived.flags.isOverdue ? (
            <FactoryStatusBadge tone='danger' className='py-1'>
              ล่าช้า {derived.flags.daysOverdue} วัน
            </FactoryStatusBadge>
          ) : null}
          {!derived.flags.isOverdue && derived.flags.isNearDeadline ? (
            <FactoryStatusBadge tone='warning' className='py-1'>
              ใกล้กำหนด
            </FactoryStatusBadge>
          ) : null}
          {derived.flags.hasRejected ? (
            <FactoryStatusBadge tone='danger' className='py-1'>
              ขอตรวจสอบใหม่
            </FactoryStatusBadge>
          ) : null}
          {derived.flags.isStaleUpdate ? (
            <FactoryStatusBadge tone='warning' className='py-1'>
              ยังไม่อัปเดต
            </FactoryStatusBadge>
          ) : null}
        </div>
      </div>
      {row.customer?.display_name ? (
        <p className='text-xs text-gray-500 mt-2'>ลูกค้า: {row.customer.display_name}</p>
      ) : null}
      <p className='text-xs text-gray-600 mt-1'>
        {formatCurrency(row.total_amount)}
        {row.rfq?.quantity
          ? ` · ${formatCompactNumber(row.rfq.quantity)} ${row.rfq.unit_name}`
          : ''}
        {row.estimated_delivery ? ` · กำหนดส่ง ${formatDateTh(row.estimated_delivery)}` : ''}
      </p>
      {row.production_summary ? (
        <p className='text-xs text-gray-500 mt-1'>
          ขั้นปัจจุบัน: {row.production_summary.current_step_name_th ?? '—'} (
          {row.production_summary.completed_count}/{row.production_summary.total_count})
        </p>
      ) : null}
      <div className='mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2'>
        <Link
          to={`/factory/orders/${row.order_id}`}
          className='inline-flex items-center gap-1 text-sm font-semibold text-gray-700'
        >
          ดูรายละเอียด <ChevronRight size={16} />
        </Link>
        {derived.primaryCta.kind !== 'view_only' ? (
          <Button
            disabled={derived.primaryCta.kind === 'waiting_customer'}
            onClick={() => onPrimaryCta(row, derived.primaryCta)}
            size='sm'
            className={factoryButtonClass({
              variant: derived.primaryCta.kind === 'waiting_customer' ? 'secondary' : 'primary',
              size: 'sm',
              className: 'min-w-[92px]',
            })}
          >
            {derived.primaryCta.kind === 'update_step'
              ? `อัปเดตขั้น ${derived.primaryCta.stepNameTh}`
              : derived.primaryCta.kind === 'start_qc'
                ? 'เริ่ม QC'
                : derived.primaryCta.kind === 'mark_shipped'
                  ? 'บันทึกจัดส่ง'
                  : 'รอลูกค้า'}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
