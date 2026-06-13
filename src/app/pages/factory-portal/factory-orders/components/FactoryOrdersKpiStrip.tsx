import React from 'react';
import { Button } from '@/components/ui/button';
import type { KpiCounts } from '@/pages/factory-portal/factory-orders/types';

type KpiKey = keyof KpiCounts;

type KpiCardDef = {
  id: KpiKey;
  label: string;
  danger?: boolean;
  meta: (count: number, total: number) => { badge: string; badgeClass: string; caption: string };
};

const KPI_CARDS: KpiCardDef[] = [
  {
    id: 'needs_action',
    label: 'ต้องดำเนินการ',
    meta: (count) =>
      count > 0
        ? {
            badge: String(count),
            badgeClass: 'bg-amber-50 text-amber-700',
            caption: 'รายการค้าง',
          }
        : {
            badge: 'ครบ',
            badgeClass: 'bg-emerald-50 text-emerald-600',
            caption: 'ไม่มีค้าง',
          },
  },
  {
    id: 'in_production',
    label: 'กำลังผลิต',
    meta: (count, total) => ({
      badge: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
      badgeClass: 'bg-brand-lavender text-brand-purple',
      caption: 'จากทั้งหมด',
    }),
  },
  {
    id: 'shipped',
    label: 'จัดส่งแล้ว',
    meta: (count, total) => ({
      badge: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
      badgeClass: 'bg-teal-50 text-teal-700',
      caption: 'จากทั้งหมด',
    }),
  },
  {
    id: 'overdue',
    label: 'ล่าช้า',
    danger: true,
    meta: (count) =>
      count > 0
        ? {
            badge: String(count),
            badgeClass: 'bg-rose-50 text-rose-600',
            caption: 'เกินกำหนด',
          }
        : {
            badge: '0',
            badgeClass: 'bg-emerald-50 text-emerald-600',
            caption: 'ตรงเวลา',
          },
  },
];

export function FactoryOrdersKpiStrip({
  kpi,
  total,
  onSelectKpi,
}: {
  kpi: KpiCounts;
  total: number;
  onSelectKpi: (key: KpiKey) => void;
}) {
  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-4'>
      {KPI_CARDS.map(({ id, label, danger, meta }) => {
        const count = kpi[id];
        const { badge, badgeClass, caption } = meta(count, total);
        const isDanger = Boolean(danger && count > 0);

        return (
          <Button
            key={id}
            variant='unstyled'
            type='button'
            onClick={() => onSelectKpi(id)}
            className={`rounded-lg border bg-white p-4 text-left transition-colors hover:border-slate-300 ${
              isDanger ? 'border-red-100 hover:border-red-200' : 'border-slate-200'
            }`}
          >
            <p className={`text-xs font-medium ${isDanger ? 'text-red-600' : 'text-slate-500'}`}>
              {label}
            </p>
            <div className='mt-3 flex items-end justify-between gap-2'>
              <p
                className={`text-2xl font-bold tabular-nums leading-none sm:text-3xl ${
                  isDanger ? 'text-red-700' : 'text-slate-900'
                }`}
              >
                {count}
              </p>
              <div className='flex min-w-0 items-center justify-end gap-1.5'>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}
                >
                  {badge}
                </span>
                <span className='truncate text-[11px] text-slate-400'>{caption}</span>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
