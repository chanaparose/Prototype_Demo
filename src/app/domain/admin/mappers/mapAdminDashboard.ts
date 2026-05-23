import { adminApi } from '@/services/api/adminApi';
import type {
  IAdminOrderListResponse,
  IAdminRevenueChartResponse,
  IAdminRfqListResponse,
} from '@/services/api/types/admin.types';
import { apiListAsRecords, asRecord, type ApiRecord } from '@/lib/apiShape';

export type AdminChartRow = {
  month: string;
  revenue: number;
  commission: number;
};

export type AdminDashboardData = {
  summary: ApiRecord;
  revenueRows: AdminChartRow[];
  recentOrders: IAdminOrderListResponse[];
  recentRfqs: IAdminRfqListResponse[];
};

export const EMPTY_ADMIN_DASHBOARD: AdminDashboardData = {
  summary: {},
  revenueRows: [],
  recentOrders: [],
  recentRfqs: [],
};

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const [summaryRaw, revenueRaw, ordersRaw, rfqsRaw] = await Promise.all([
    adminApi.dashboardSummary(),
    adminApi.dashboardRevenueChart(),
    adminApi.listOrders({ page: 1, page_size: 5 }),
    adminApi.listRfqs({ page: 1, page_size: 5 }),
  ]);

  const summary = asRecord(summaryRaw);

  const revenueObj =
    revenueRaw && typeof revenueRaw === 'object'
      ? (revenueRaw as IAdminRevenueChartResponse)
      : null;
  const sourceRows =
    revenueObj && Array.isArray(revenueObj.data)
      ? apiListAsRecords(revenueObj.data)
      : apiListAsRecords(revenueRaw);
  const revenueRows = sourceRows.map((r) => ({
    month: String(r.month ?? r.date ?? r.period ?? r.label ?? '-'),
    revenue: Number(r.revenue ?? r.gross_order_value ?? 0),
    commission: Number(r.commission ?? r.platform_commission ?? 0),
  }));

  return {
    summary,
    revenueRows: revenueRows.slice(-6),
    recentOrders: apiListAsRecords(ordersRaw) as IAdminOrderListResponse[],
    recentRfqs: apiListAsRecords(rfqsRaw) as IAdminRfqListResponse[],
  };
}
