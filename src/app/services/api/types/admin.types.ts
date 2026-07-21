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
  factory_id?: number;
  factory_name?: string;
  factory_email?: string;
  total_amount?: string | number;
  grand_total?: string | number;
  platform_commission_amount?: string | number;
  platform_commission_rate?: string | number;
  factory_net_receivable?: string | number;
  vat_amount?: string | number;
  vat_rate?: string | number;
  status?: string;
  slip_status?: string;
  slip_url?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface IAdminOrderFinance {
  platform_commission_rate?: string | number;
  platform_commission_amount?: string | number;
  vat_rate?: string | number;
  vat_amount?: string | number;
  factory_net_receivable?: string | number;
  grand_total?: string | number;
}

/** GET /admin/orders/:id — OrderDetailResponse + admin_finance */
export interface IAdminOrderDetailResponse {
  order_id: number;
  quote_id?: number;
  user_id?: number;
  factory_id?: number;
  total_amount?: string | number;
  deposit_amount?: string | number;
  status?: string;
  status_label_th?: string;
  payment_type?: string;
  currency?: string;
  factory?: {
    factory_id?: number;
    name?: string;
    phone?: string;
    address?: string;
    [key: string]: unknown;
  };
  customer_user_id?: number;
  customer_name?: string;
  customer_phone?: string;
  estimated_delivery?: string;
  shipping_days?: number;
  lead_time_days?: number;
  tracking_no?: string;
  courier?: string;
  shipped_at?: string;
  created_at?: string;
  updated_at?: string;
  next_action?: Record<string, unknown> | null;
  payment_schedule?: Array<Record<string, unknown>>;
  rfq?: Record<string, unknown>;
  quotation?: Record<string, unknown>;
  admin_finance?: IAdminOrderFinance;
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
  /** ผลตรวจสลิปอัตโนมัติ (SlipOK) — มีเฉพาะ response ของ attach: approved | rejected | pending */
  verify_outcome?: 'approved' | 'rejected' | 'pending';
  /** เหตุผลที่ไม่ผ่าน/รอตรวจ — backend ส่งมาครบทุกข้อ */
  verify_reasons?: string[];
}

/** หนึ่งครั้งที่ลูกค้าแนบสลิป (transaction type='BU') */
export interface ISlipHistoryItem {
  tx_id: number;
  status: string; // PT = รอตรวจ | RJ = ถูกปฏิเสธ | ST = อนุมัติแล้ว
  amount: number;
  slip_url?: string | null;
  slip_note?: string | null;
  bank_ref?: string | null;
  uploaded_at?: string | null;
  verified_at?: string | null;
}

export interface ISlipHistoryResponse {
  items: ISlipHistoryItem[];
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
  slip_urls?: string[] | null;
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

// ─── Factory Review ───────────────────────────────────────────────────────────

export interface IFactoryReview {
  review_id: number;
  factory_id: number;
  user_id: number;
  order_id?: number | null;
  rating: number;
  comment: string;
  image_urls: string[];
  created_at: string;
  updated_at?: string | null;
  factory_reply?: string | null;
  factory_reply_at?: string | null;
  factory_reply_by?: number | null;
  reviewer_name?: string | null;
}

export interface IFactoryReviewSummary {
  factory_id: number;
  average_rating: number;
  review_count: number;
  rating_breakdown: Record<string, number>;
}

export interface IFactoryReviewsResponse {
  reviews: IFactoryReview[];
  summary: IFactoryReviewSummary;
  total: number;
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
