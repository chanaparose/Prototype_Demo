/**
 * Admin APIs — Platform management, factories, orders, customers, settlements
 */

import { httpClient } from '@/services/api/httpClient';
import type {
  IAdminCommissionExemptionResponse,
  IAdminCommissionRuleResponse,
  IAdminCustomerDetailResponse,
  IAdminCustomerListItemResponse,
  IAdminCustomerOrderItemResponse,
  IAdminCustomerWalletResponse,
  IAdminDashboardSummaryResponse,
  IAdminFactoryListResponse,
  IAdminOrderListResponse,
  IAdminOrderDetailResponse,
  IAdminRevenueChartResponse,
  IAdminRfqListResponse,
  IAdminSettlementListItemResponse,
  IAdminTopCustomerResponse,
  IAdminTopFactoryResponse,
  IAssignFactoryConfigRequest,
  ICreatePlatformConfigRequest,
  IFactoryConfigResponse,
  IPlatformConfigItemResponse,
  IPlatformConfigResponse,
  IUpdatePlatformConfigRequest,
  ISlipInfoResponse,
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
  ICommissionSummaryResponse,
} from '@/services/api/types/admin.types';

export type { IPlatformConfigResponse } from '@/services/api/types/admin.types';

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

export const platformConfigApi = {
  getActive: () => httpClient.get<IPlatformConfigResponse>('/admin/platform-config'),

  create: (body: Partial<IPlatformConfigResponse>) =>
    httpClient.post<IPlatformConfigResponse>('/admin/platform-config', body),

  history: () => httpClient.get<IPlatformConfigResponse[]>('/admin/platform-config/history'),
};

export const adminTConfigApi = {
  getAll: () =>
    httpClient.get<{ configs: Record<string, string> }>('/admin/tconfig'),

  patchBulk: (data: Record<string, string>) =>
    httpClient.patch<{ message: string }>('/admin/tconfig', data),
};

export const adminConfigApi = {
  /** Returns all platform_config rows (for Config Packages tab) */
  listConfigs: () =>
    httpClient.get<{
      configs: IPlatformConfigItemResponse[];
      total: number;
    }>('/admin/platform-configs'),

  /** Returns the single row WHERE label = 'default_comm' (for Commission tab) */
  getDefaultComm: () =>
    httpClient.get<IPlatformConfigItemResponse>('/admin/platform-configs/default-comm'),

  updateConfig: (configId: number, data: IUpdatePlatformConfigRequest) =>
    httpClient.patch<IPlatformConfigItemResponse>(`/admin/platform-configs/${configId}`, data),

  createConfig: (data: ICreatePlatformConfigRequest) =>
    httpClient.post<IPlatformConfigItemResponse>('/admin/platform-configs', data),

  deleteConfig: (configId: number) =>
    httpClient.delete<void>(`/admin/platform-configs/${configId}`),
};

export const adminFactoryConfigApi = {
  getFactoryConfig: (factoryId: number) =>
    httpClient.get<IFactoryConfigResponse>(`/admin/factories/${factoryId}/config`),

  assignConfig: (factoryId: number, data: IAssignFactoryConfigRequest) =>
    httpClient.patch<IFactoryConfigResponse>(`/admin/factories/${factoryId}/config`, data),
};

export const adminFactoryCertApi = {
  patchStatus: (factoryId: number, mapId: number, verifyStatus: 'AP' | 'RJ' | 'PE') =>
    httpClient.patch<{ factory_id: number; map_id: number; verify_status: string }>(
      `/admin/factories/${factoryId}/certificates/${mapId}`,
      { verify_status: verifyStatus },
    ),
};

// ─── Slip API (F1, F2, F3) ──────────────────────────────────────────────────

export const slipApi = {
  getInfo: (orderId: number) =>
    httpClient.get<ISlipInfoResponse>(`/orders/${orderId}/slip`),

  attach: (orderId: number, formData: FormData) =>
    httpClient.postForm<ISlipInfoResponse>(`/orders/${orderId}/slip`, formData),

  verify: (orderId: number, action: 'approve' | 'reject', reason?: string) =>
    httpClient.patch<ISlipInfoResponse>(`/factory/orders/${orderId}/verify-slip`, { action, reason }),

  /** escrow mode: superadmin ตรวจสอบสลิปแทนโรงงาน */
  verifyAsAdmin: (orderId: number, action: 'approve' | 'reject', reason?: string) =>
    httpClient.patch<ISlipInfoResponse>(`/admin/orders/${orderId}/verify-slip`, { action, reason }),
};

// ─── Withdrawal Admin API (escrow mode) ─────────────────────────────────────

export const adminWithdrawalApi = {
  list: (params?: { status?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 1));
    q.set('page_size', String(params?.page_size ?? 100));
    return httpClient.get<Record<string, unknown>>(`/admin/withdrawals?${q.toString()}`);
  },

  /** อัปเดตสถานะ AP/RJ/CP — เมื่อ CP ต้องส่ง slip_url (อัปโหลดผ่าน media upload ก่อน) */
  patch: (
    requestId: number,
    data: { status: 'AP' | 'RJ' | 'CP'; comments?: string; slip_url?: string },
  ) => httpClient.patch<Record<string, unknown>>(`/admin/withdrawals/${requestId}`, data),
};

// ─── Commission Invoice Admin API (F5) ──────────────────────────────────────

export const adminCommissionApi = {
  generate: (month: number, year: number) =>
    httpClient.post<{ created: number; period_month: number; period_year: number }>(
      '/admin/invoices/generate',
      { month, year },
    ),

  list: (params?: { month?: number; year?: number }) =>
    httpClient.get<{ invoices: ICommissionInvoiceResponse[]; total: number }>(
      `/admin/invoices${params ? `?month=${params.month ?? 0}&year=${params.year ?? 0}` : ''}`,
    ),

  get: (invoiceId: number) =>
    httpClient.get<{ invoice: ICommissionInvoiceResponse; items: ICommissionInvoiceItemResponse[] }>(
      `/admin/invoices/${invoiceId}`,
    ),

  send: (invoiceId: number) =>
    httpClient.post<ICommissionInvoiceResponse>(`/admin/invoices/${invoiceId}/send`, {}),

  resend: (invoiceId: number) =>
    httpClient.post<ICommissionInvoiceResponse>(`/admin/invoices/${invoiceId}/resend`, {}),

  verify: (invoiceId: number, action: 'approve' | 'reject') =>
    httpClient.patch<ICommissionInvoiceResponse>(`/admin/invoices/${invoiceId}/verify`, { action }),

  summary: (params?: { month?: number; year?: number }) =>
    httpClient.get<ICommissionSummaryResponse>(
      `/admin/commission/summary${params ? `?month=${params.month ?? 0}&year=${params.year ?? 0}` : ''}`,
    ),

  /** escrow mode: ค่าคอมมิชชันที่ Tryly ได้รับต่อออเดอร์ */
  escrowOrders: () =>
    httpClient.get<{
      orders: Array<{
        order_id: number;
        factory_id: number;
        factory_name: string;
        customer_name: string;
        status: string;
        grand_total: number;
        commission_rate: number;
        commission_amount: number;
        vat_amount: number;
        factory_net: number;
        created_at: string;
      }>;
      total_commission: number;
      total_gross: number;
      count: number;
    }>('/admin/commission/orders'),
};

export const adminApi = {
  dashboardSummary: () =>
    httpClient.get<IAdminDashboardSummaryResponse>('/admin/dashboard/summary'),

  dashboardRevenueChart: (params?: {
    date_from?: string;
    date_to?: string;
    granularity?: 'day' | 'week' | 'month';
  }) =>
    httpClient.get<IAdminRevenueChartResponse>(
      `/admin/dashboard/revenue-chart${qs({
        date_from: params?.date_from,
        date_to: params?.date_to,
        granularity: params?.granularity,
      })}`,
    ),

  dashboardTopFactories: (params?: { date_from?: string; date_to?: string; limit?: number }) =>
    httpClient.get<
      | IAdminTopFactoryResponse[]
      | {
          data?: IAdminTopFactoryResponse[];
          items?: IAdminTopFactoryResponse[];
          rows?: IAdminTopFactoryResponse[];
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
    httpClient.get<IAdminFactoryListResponse[]>(
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
    httpClient.get<IAdminRfqListResponse[]>(
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
    httpClient.get<IAdminOrderListResponse[]>(
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
    httpClient.get<IAdminOrderDetailResponse>(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: number | string, status: string) =>
    httpClient.patch<Record<string, unknown>>(`/admin/orders/${orderId}/status`, { status }),

  listCommissionRules: (params?: { factory_id?: number; active_only?: boolean }) =>
    httpClient.get<IAdminCommissionRuleResponse[]>(
      `/admin/commission-rules${qs({
        factory_id: params?.factory_id,
        active_only: params?.active_only,
      })}`,
    ),

  createCommissionRule: (body: {
    factory_id: number;
    commission_rate: number;
    effective_from?: string;
  }) => httpClient.post<IAdminCommissionRuleResponse>('/admin/commission-rules', body),

  deleteCommissionRule: (ruleId: number | string) =>
    httpClient.delete<void>(`/admin/commission-rules/${ruleId}`),

  listCommissionExemptions: (params?: { active_only?: boolean }) =>
    httpClient.get<IAdminCommissionExemptionResponse[]>(
      `/admin/commission-exemptions${qs({
        active_only: params?.active_only,
      })}`,
    ),

  createCommissionExemption: (body: { factory_id: number; reason: string; expires_at?: string }) =>
    httpClient.post<IAdminCommissionExemptionResponse>('/admin/commission-exemptions', body),

  deleteCommissionExemption: (exemptionId: number | string) =>
    httpClient.delete<void>(`/admin/commission-exemptions/${exemptionId}`),
};

export const adminCustomerApi = {
  list: (params?: { search?: string; is_active?: boolean; limit?: number; offset?: number }) =>
    httpClient.get<{
      customers: IAdminCustomerListItemResponse[];
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

  getDetail: (userId: number) =>
    httpClient.get<IAdminCustomerDetailResponse>(`/admin/customers/${userId}`),

  getWallet: (userId: number) =>
    httpClient.get<IAdminCustomerWalletResponse>(`/admin/customers/${userId}/wallet`),

  getOrders: (userId: number, params?: { limit?: number; offset?: number }) =>
    httpClient.get<{
      orders: IAdminCustomerOrderItemResponse[];
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
      top_customers: IAdminTopCustomerResponse[];
    }>(`/admin/dashboard/top-customers${qs({ limit })}`),
};

export const adminSettlementApi = {
  listByFactory: (factoryId: number, params?: { limit?: number; offset?: number }) =>
    httpClient.get<{
      settlements: IAdminSettlementListItemResponse[];
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


export const adminCatalogApi = {
  patchCategoryImg: (categoryId: number, img: string) =>
    httpClient.patch<{ ok: boolean; category_id: number; img: string }>(
      `/admin/categories/${categoryId}/img`,
      { img },
    ),

  /** Upload / replace hub cover image shown on /factory-ideas-hub. */
  patchHubImg: (hubId: number, img: string) =>
    httpClient.patch<{ ok: boolean; hub_id: number; img: string }>(
      `/admin/hubs/${hubId}/img`,
      { img },
    ),
};
