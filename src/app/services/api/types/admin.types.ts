export interface IPlatformConfigResponse {
  [key: string]: unknown;
}

export interface IPlatformConfigItemResponse {
  [key: string]: unknown;
}

export interface ICreatePlatformConfigRequest {
  [key: string]: unknown;
}

export interface IUpdatePlatformConfigRequest {
  [key: string]: unknown;
}

export interface IFactoryConfigResponse {
  [key: string]: unknown;
}

export interface IAssignFactoryConfigRequest {
  [key: string]: unknown;
}

export interface IAdminDashboardSummaryResponse {
  gross_order_value?: number;
  vat_collected?: number;
  platform_commission?: number;
  total_orders?: number;
  total_rfqs?: number;
  pending_factory_approvals?: number;
  [key: string]: unknown;
}

export interface IAdminRevenueChartPointResponse {
  date: string;
  gross_order_value: number;
  platform_commission: number;
  vat_collected: number;
  order_count: number;
  [key: string]: unknown;
}

export interface IAdminRevenueChartResponse {
  granularity?: 'day' | 'week' | 'month' | string;
  data: IAdminRevenueChartPointResponse[];
  [key: string]: unknown;
}

export interface IAdminTopFactoryResponse {
  factory_id?: number;
  factory_name?: string;
  gross_order_value?: number;
  platform_commission?: number;
  vat_collected?: number;
  order_count?: number;
  [key: string]: unknown;
}

export interface IAdminFactoryListResponse {
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

export interface IAdminRfqListResponse {
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

export interface IAdminOrderListResponse {
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

export interface IAdminCommissionRuleResponse {
  rule_id?: number;
  factory_id: number;
  commission_rate: number;
  effective_from?: string;
  [key: string]: unknown;
}

export interface IAdminCommissionExemptionResponse {
  exemption_id?: number;
  factory_id: number;
  reason: string;
  expires_at?: string;
  [key: string]: unknown;
}

export interface IAdminCustomerListItemResponse {
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

export interface IAdminCustomerDetailResponse {
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

export interface IAdminWalletTxItemResponse {
  tx_id: string;
  wallet_id: number;
  order_id?: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface IAdminCustomerWalletResponse {
  wallet_id?: number;
  user_id: number;
  good_fund: number;
  pending_fund: number;
  total: number;
  transactions: IAdminWalletTxItemResponse[];
}

export interface IAdminTopCustomerResponse {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_orders: number;
  total_spend: number;
}

export interface IAdminSettlementListItemResponse {
  settlement_id: number;
  factory_id: number;
  order_id: number;
  amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface IAdminCustomerOrderItemResponse {
  order_id: number;
  rfq_id: number;
  factory_id: number;
  factory_name: string;
  grand_total: number;
  status: string;
  created_at: string;
}
