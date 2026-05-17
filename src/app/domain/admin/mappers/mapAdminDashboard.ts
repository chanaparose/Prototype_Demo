import {
  adminApi,
  type AdminOrderRow,
  type AdminRevenueChartResponse,
  type AdminRfqRow,
} from '@/services/api/adminApi';

export type AdminChartRow = {
  month: string;
  revenue: number;
  commission: number;
};

export type AdminDashboardData = {
  summary: Record<string, unknown>;
  revenueRows: AdminChartRow[];
  recentOrders: AdminOrderRow[];
  recentRfqs: AdminRfqRow[];
};

export const EMPTY_ADMIN_DASHBOARD: AdminDashboardData = {
  summary: {},
  revenueRows: [],
  recentOrders: [],
  recentRfqs: [],
};

function parseRows<T extends Record<string, unknown>>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const [summaryRaw, revenueRaw, ordersRaw, rfqsRaw] = await Promise.all([
    adminApi.dashboardSummary(),
    adminApi.dashboardRevenueChart(),
    adminApi.listOrders({ page: 1, page_size: 5 }),
    adminApi.listRfqs({ page: 1, page_size: 5 }),
  ]);

  const summary = summaryRaw as Record<string, unknown>;

  const revenueObj =
    revenueRaw && typeof revenueRaw === 'object'
      ? (revenueRaw as AdminRevenueChartResponse)
      : null;
  const sourceRows =
    revenueObj && Array.isArray(revenueObj.data)
      ? revenueObj.data
      : parseRows<Record<string, unknown>>(revenueRaw);
  const revenueRows = sourceRows.map((r) => ({
    month: String(r.month ?? r.date ?? r.period ?? r.label ?? '-'),
    revenue: Number(r.revenue ?? r.gross_order_value ?? 0),
    commission: Number(r.commission ?? r.platform_commission ?? 0),
  }));

  return {
    summary,
    revenueRows: revenueRows.slice(-6),
    recentOrders: parseRows<AdminOrderRow>(ordersRaw).slice(0, 5),
    recentRfqs: parseRows<AdminRfqRow>(rfqsRaw).slice(0, 5),
  };
}
