export type OrderStatusCode = 'WS' | 'WA' | 'PP' | 'PE' | 'PD' | 'PR' | 'QC' | 'SH' | 'CP' | 'CN' | 'CC' | 'CL';

export interface ProductionSummaryRow {
  current_step_code: string | null;
  current_step_name_th: string | null;
  current_step_id: number | null;
  current_update_status: 'PD' | 'IP' | 'CD' | 'RJ' | null;
  completed_count: number;
  total_count: number;
  last_updated_at: string | null;
  has_rejected: boolean;
}

export interface FactoryOrderRow {
  order_id: number;
  status: OrderStatusCode;
  total_amount: number;
  deposit_amount: number;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  factory_id: number;
  customer: { user_id: number; display_name: string } | null;
  rfq: { rfq_id: number; title: string; quantity: number; unit_name: string } | null;
  request_kind: 'PR' | 'MR' | 'PS' | 'MS' | null;
  production_summary: ProductionSummaryRow | null;
}

export type TabId =
  | 'all'
  | 'awaiting_customer'
  | 'verify_slip'
  | 'needs_action'
  | 'in_production'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type SortKey = 'newest' | 'deadline' | 'amount_desc';

export interface DerivedCardState {
  flags: {
    isOverdue: boolean;
    daysOverdue: number;
    isNearDeadline: boolean;
    hasRejected: boolean;
    isStaleUpdate: boolean;
  };
  primaryCta:
    | { kind: 'update_step'; stepId: number; stepNameTh: string }
    | { kind: 'start_qc' }
    | { kind: 'mark_shipped' }
    | { kind: 'waiting_customer' }
    | { kind: 'view_only' };
}

export type KpiCounts = {
  needs_action: number;
  in_production: number;
  shipped: number;
  overdue: number;
};
