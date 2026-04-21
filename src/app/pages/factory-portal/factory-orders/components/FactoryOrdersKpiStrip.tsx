import React from 'react';
import type { KpiCounts } from '../types';

type KpiKey = keyof KpiCounts;

export function FactoryOrdersKpiStrip({
  kpi,
  onSelectKpi,
}: {
  kpi: KpiCounts;
  onSelectKpi: (key: KpiKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        ['needs_action', 'ต้องดำเนินการ', false],
        ['in_production', 'กำลังผลิต', false],
        ['shipped', 'พร้อมจัดส่ง / จัดส่งแล้ว', false],
        ['overdue', 'ล่าช้า', true],
      ].map(([id, label, danger]) => (
        <button
          key={id}
          type="button"
          className={`rounded-2xl p-3 text-left border ${danger ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}
          onClick={() => onSelectKpi(id as KpiKey)}
        >
          <p className={`text-2xl font-bold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{kpi[id as KpiKey]}</p>
          <p className={`text-xs ${danger ? 'text-red-700' : 'text-gray-500'}`}>{label}</p>
        </button>
      ))}
    </div>
  );
}
