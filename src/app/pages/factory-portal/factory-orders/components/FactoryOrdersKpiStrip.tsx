import React from 'react';
import type { KpiCounts } from '@/pages/factory-portal/factory-orders/types';
import {
  FactoryMetricCard,
  FactoryMetricGrid,
} from '@/pages/factory-portal/components/FactoryMetricCards';

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
    <FactoryMetricGrid>
      {KPI_CARDS.map(({ id, label, danger, meta }) => {
        const count = kpi[id];
        const { badge, badgeClass, caption } = meta(count, total);
        const isDanger = Boolean(danger && count > 0);

        return (
          <FactoryMetricCard
            key={id}
            label={label}
            value={count}
            badge={badge}
            badgeClassName={badgeClass}
            caption={caption}
            danger={isDanger}
            onClick={() => onSelectKpi(id)}
          />
        );
      })}
    </FactoryMetricGrid>
  );
}
