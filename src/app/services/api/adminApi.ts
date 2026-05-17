/**
 * Admin APIs — Platform management, factories, orders, customers, settlements
 */

import { httpClient } from '@/services/api/httpClient';

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

export interface PlatformConfig {
  [key: string]: unknown;
}

export interface PlatformConfigItem {
  [key: string]: unknown;
}

export interface CreatePlatformConfigRequest {
  [key: string]: unknown;
}

export interface UpdatePlatformConfigRequest {
  [key: string]: unknown;
}

export interface FactoryConfigResponse {
  [key: string]: unknown;
}

export interface AssignFactoryConfigRequest {
  [key: string]: unknown;
}

export interface AdminDashboardSummary {
  gross_order_value?: number;
  vat_collected?: number;
  platform_commission?: number;
  total_orders?: number;
  total_rfqs?: number;
  pending_factory_approvals?: number;
  [key: string]: unknown;
}

export interface AdminRevenueChartPoint {
  date: string;
  gross_order_value: number;
  platform_commission: number;
  vat_collected: number;
  order_count: number;
  [key: string]: unknown;
}

export interface AdminRevenueChartResponse {
  granularity?: 'day' | 'week' | 'month' | string;
  data: AdminRevenueChartPoint[];
  [key: string]: unknown;
}

export interface AdminTopFactoryRow {
  factory_id?: number;
  factory_name?: string;
  gross_order_value?: number;
  platform_commission?: number;
  vat_collected?: number;
  order_count?: number;
  [key: string]: unknown;
}

export interface AdminFactoryRow {
  factory_id: number;
  factory_name?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  approval_status?: string;
  is_verified?: boolean;
  submitted_at?: string;
  registered_at?: string;
  created_at?: string;
  province_name?: string;
  business_type_name?: string;
  rejection_reason?: string;
  [key: string]: unknown;
}

export interface AdminRfqRow {
  rfq_id: number;
  title?: string;
  user_id?: number;
  customer_name?: string;
  customer_email?: string;
  category_name?: string;
  sub_category_name?: string;
  quantity?: number;
  status?: string;
  quotation_count?: number;
  target_price?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminOrderRow {
  order_id: number;
  quote_id?: number;
  rfq_id?: number;
  rfq_title?: string;
  customer_name?: string;
  customer_email?: string;
  factory_name?: string;
  factory_email?: string;
  grand_total?: number;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminCommissionRule {
  rule_id?: number;
  factory_id: number;
  commission_rate: number;
  effective_from?: string;
  [key: string]: unknown;
}

export interface AdminCommissionExemption {
  exemption_id?: number;
  factory_id: number;
  reason: string;
  expires_at?: string;
  [key: string]: unknown;
}

export interface AdminCustomerListItem {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  total_orders: number;
  total_spend: number;
  wallet_balance: number;
  created_at: string;
}

export interface AdminCustomerDetail {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  total_orders: number;
  total_spend: number;
  created_at: string;
  wallet_id?: number;
  good_fund: number;
  pending_fund: number;
}

export interface AdminWalletTxItem {
  tx_id: string;
  wallet_id: number;
  order_id?: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface AdminCustomerWallet {
  wallet_id?: number;
  user_id: number;
  good_fund: number;
  pending_fund: number;
  total: number;
  transactions: AdminWalletTxItem[];
}

export interface AdminTopCustomer {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_orders: number;
  total_spend: number;
}

export interface AdminSettlementListItem {
  settlement_id: number;
  factory_id: number;
  order_id: number;
  amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminCustomerOrderItem {
  order_id: number;
  rfq_id: number;
  factory_id: number;
  factory_name: string;
  grand_total: number;
  status: string;
  created_at: string;
}

export const platformConfigApi = {
  getActive: () => httpClient.get<PlatformConfig>('/admin/platform-config'),

  create: (body: Partial<PlatformConfig>) =>
    httpClient.post<PlatformConfig>('/admin/platform-config', body),

  history: () => httpClient.get<PlatformConfig[]>('/admin/platform-config/history'),
};

export const adminConfigApi = {
  listConfigs: () =>
    httpClient.get<{
      configs: PlatformConfigItem[];
      total: number;
    }>('/admin/platform-configs'),

  updateConfig: (configId: number, data: UpdatePlatformConfigRequest) =>
    httpClient.patch<PlatformConfigItem>(`/admin/platform-configs/${configId}`, data),

  createConfig: (data: CreatePlatformConfigRequest) =>
    httpClient.post<PlatformConfigItem>('/admin/platform-configs', data),

  deleteConfig: (configId: number) =>
    httpClient.delete<void>(`/admin/platform-configs/${configId}`),
};

export const adminFactoryConfigApi = {
  getFactoryConfig: (factoryId: number) =>
    httpClient.get<FactoryConfigResponse>(`/admin/factories/${factoryId}/config`),

  assignConfig: (factoryId: number, data: AssignFactoryConfigRequest) =>
    httpClient.patch<FactoryConfigResponse>(`/admin/factories/${factoryId}/config`, data),
};

export const adminApi = {
  dashboardSummary: () => httpClient.get<AdminDashboardSummary>('/admin/dashboard/summary'),

  dashboardRevenueChart: (params?: {
    date_from?: string;
    date_to?: string;
    granularity?: 'day' | 'week' | 'month';
  }) =>
    httpClient.get<AdminRevenueChartResponse>(
      `/admin/dashboard/revenue-chart${qs({
        date_from: params?.date_from,
        date_to: params?.date_to,
        granularity: params?.granularity,
      })}`,
    ),

  dashboardTopFactories: (params?: { date_from?: string; date_to?: string; limit?: number }) =>
    httpClient.get<
      | AdminTopFactoryRow[]
      | {
          data?: AdminTopFactoryRow[];
          items?: AdminTopFactoryRow[];
          rows?: AdminTopFactoryRow[];
        }
    >(
      `/admin/dashboard/top-factories${qs({
        date_from: params?.date_from,
        date_to: params?.date_to,
        limit: params?.limit,
      })}`,
    ),

  listFactories: (params?: {
    approval_status?: string;
    search?: string;
    page?: number;
    page_size?: number;
    is_verified?: boolean;
  }) =>
    httpClient.get<AdminFactoryRow[]>(
      `/admin/factories${qs({
        approval_status: params?.approval_status,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
        is_verified: params?.is_verified,
      })}`,
    ),

  getFactory: (factoryId: number | string) =>
    httpClient.get<Record<string, unknown>>(`/admin/factories/${factoryId}`),

  approveFactory: (factoryId: number | string) =>
    httpClient.post<Record<string, unknown>>(`/admin/factories/${factoryId}/approve`),

  rejectFactory: (factoryId: number | string, reason: string) =>
    httpClient.post<Record<string, unknown>>(`/admin/factories/${factoryId}/reject`, { reason }),

  suspendFactory: (factoryId: number | string, reason?: string) =>
    httpClient.post<Record<string, unknown>>(
      `/admin/factories/${factoryId}/suspend`,
      reason ? { reason } : {},
    ),

  unsuspendFactory: (factoryId: number | string) =>
    httpClient.post<Record<string, unknown>>(`/admin/factories/${factoryId}/unsuspend`),

  updateFactoryVerification: (factoryId: number | string, isVerified: boolean) =>
    httpClient.patch<Record<string, unknown>>(`/admin/factories/${factoryId}/verification`, {
      is_verified: isVerified,
    }),

  listRfqs: (params?: {
    status?: string;
    user_id?: number;
    category_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) =>
    httpClient.get<AdminRfqRow[]>(
      `/admin/rfqs${qs({
        status: params?.status,
        user_id: params?.user_id,
        category_id: params?.category_id,
        date_from: params?.date_from,
        date_to: params?.date_to,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
      })}`,
    ),

  getRfq: (rfqId: number | string) =>
    httpClient.get<Record<string, unknown>>(`/admin/rfqs/${rfqId}`),

  updateRfqStatus: (rfqId: number | string, status: string) =>
    httpClient.patch<Record<string, unknown>>(`/admin/rfqs/${rfqId}/status`, { status }),

  listOrders: (params?: {
    status?: string;
    factory_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) =>
    httpClient.get<AdminOrderRow[]>(
      `/admin/orders${qs({
        status: params?.status,
        factory_id: params?.factory_id,
        user_id: params?.user_id,
        date_from: params?.date_from,
        date_to: params?.date_to,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
      })}`,
    ),

  getOrder: (orderId: number | string) =>
    httpClient.get<Record<string, unknown>>(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: number | string, status: string) =>
    httpClient.patch<Record<string, unknown>>(`/admin/orders/${orderId}/status`, { status }),

  listCommissionRules: (params?: { factory_id?: number; active_only?: boolean }) =>
    httpClient.get<AdminCommissionRule[]>(
      `/admin/commission-rules${qs({
        factory_id: params?.factory_id,
        active_only: params?.active_only,
      })}`,
    ),

  createCommissionRule: (body: {
    factory_id: number;
    commission_rate: number;
    effective_from?: string;
  }) => httpClient.post<AdminCommissionRule>('/admin/commission-rules', body),

  deleteCommissionRule: (ruleId: number | string) =>
    httpClient.delete<void>(`/admin/commission-rules/${ruleId}`),

  listCommissionExemptions: (params?: { active_only?: boolean }) =>
    httpClient.get<AdminCommissionExemption[]>(
      `/admin/commission-exemptions${qs({
        active_only: params?.active_only,
      })}`,
    ),

  createCommissionExemption: (body: { factory_id: number; reason: string; expires_at?: string }) =>
    httpClient.post<AdminCommissionExemption>('/admin/commission-exemptions', body),

  deleteCommissionExemption: (exemptionId: number | string) =>
    httpClient.delete<void>(`/admin/commission-exemptions/${exemptionId}`),
};

export const adminCustomerApi = {
  list: (params?: { search?: string; is_active?: boolean; limit?: number; offset?: number }) =>
    httpClient.get<{
      customers: AdminCustomerListItem[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/admin/customers${qs({
        search: params?.search,
        is_active: params?.is_active,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  getDetail: (userId: number) => httpClient.get<AdminCustomerDetail>(`/admin/customers/${userId}`),

  getWallet: (userId: number) =>
    httpClient.get<AdminCustomerWallet>(`/admin/customers/${userId}/wallet`),

  getOrders: (userId: number, params?: { limit?: number; offset?: number }) =>
    httpClient.get<{
      orders: AdminCustomerOrderItem[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/admin/customers/${userId}/orders${qs({
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),

  topCustomers: (limit = 5) =>
    httpClient.get<{
      top_customers: AdminTopCustomer[];
    }>(`/admin/dashboard/top-customers${qs({ limit })}`),
};

export const adminSettlementApi = {
  listByFactory: (factoryId: number, params?: { limit?: number; offset?: number }) =>
    httpClient.get<{
      settlements: AdminSettlementListItem[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/admin/factories/${factoryId}/settlements${qs({
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    ),
};
