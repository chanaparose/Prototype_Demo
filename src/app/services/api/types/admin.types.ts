export interface IPlatformConfigResponse {
  config_id?: number;
  label?: string | null;
  default_commission_rate?: number;
  promo_commission_rate?: number | null;
  promo_start_at?: string | null;
  promo_end_at?: string | null;
  promo_label?: string | null;
  vat_rate?: number;
  currency_code?: string;
  effective_from?: string;
  effective_to?: string | null;
  created_by?: number | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface IPlatformConfigItemResponse {
  config_id: number;
  label?: string | null;
  default_commission_rate: number;
  vat_rate: number;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface ICreatePlatformConfigRequest {
  label?: string | null;
  default_commission_rate: number;
  vat_rate: number;
  currency_code?: string;
  effective_to?: string | null;
  [key: string]: unknown;
}

export interface IUpdatePlatformConfigRequest {
  label?: string;
  default_commission_rate?: number;
  vat_rate?: number;
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

// ─── Bank Account ─────────────────────────────────────────────────────────────

export interface IBankAccountResponse {
  account_id: number;
  factory_id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Slip ─────────────────────────────────────────────────────────────────────

export interface ISlipInfoResponse {
  order_id: number;
  slip_status: string; // PE | ST | AP | RJ
  slip_url?: string | null;
  slip_note?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  uploaded_at?: string | null;
}

// ─── Commission Invoice ───────────────────────────────────────────────────────

export interface ICommissionInvoiceResponse {
  invoice_id: number;
  factory_id: number;
  factory_name: string;
  period_month: number;
  period_year: number;
  total_orders: number;
  total_amount: number;
  commission_amount: number;
  vat_amount: number;
  grand_total: number;
  status: string; // DR | ST | PA | VR
  slip_url?: string | null;
  slip_note?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  email_sent_at?: string | null;
  created_at: string;
}

export interface ICommissionInvoiceItemResponse {
  item_id: number;
  invoice_id: number;
  order_id: number;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
}

export interface ICurrentPeriodOrder {
  order_id: number;
  rfq_title: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  commission_vat: number;
  line_total: number;
  approved_at: string;
}

export interface ICurrentPeriodSummary {
  month: number;
  year: number;
  total_orders: number;
  total_amount: number;
  commission_amount: number;
  vat_amount: number;
  grand_total: number;
  orders: ICurrentPeriodOrder[];
}

export interface ICommissionSummaryResponse {
  total_invoices: number;
  total_commission: number;
  total_vat: number;
  total_grand: number;
  draft_count: number;
  sent_count: number;
  paid_count: number;
  verified_count: number;
}
