import type {
  DerivedCardState,
  FactoryOrderRow,
  KpiCounts,
  TabId,
} from '@/pages/factory-portal/factory-orders/types';
import { matchTab } from '@/pages/factory-portal/factory-orders/factoryOrderFilters';

export function computeKpi(rows: FactoryOrderRow[], derived: DerivedCardState[]): KpiCounts {
  return {
    needs_action: rows.filter((_, i) => matchTab(rows[i], derived[i], 'needs_action')).length,
    in_production: rows.filter((r) => ['PR', 'QC'].includes(r.status)).length,
    shipped: rows.filter((r) => r.status === 'SH').length,
    overdue: derived.filter((d) => d.flags.isOverdue).length,
  };
}

export function countByTab(
  rows: FactoryOrderRow[],
  derived: DerivedCardState[],
): Record<TabId, number> {
  const tabs: TabId[] = [
    'all',
    'awaiting_customer',
    'verify_slip',
    'needs_action',
    'in_production',
    'shipped',
    'completed',
    'cancelled',
  ];
  return tabs.reduce(
    (acc, t) => ({
      ...acc,
      [t]:
        t === 'all' ? rows.length : rows.filter((_, i) => matchTab(rows[i], derived[i], t)).length,
    }),
    {
      all: 0,
      awaiting_customer: 0,
      verify_slip: 0,
      needs_action: 0,
      in_production: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    },
  );
}
