export type ProductionStepStatus = 'PD' | 'IP' | 'CD' | 'RJ';

export interface IProductionStepTemplate {
  step_id: number;
  step_code: string;
  step_name_th: string;
  step_name_en?: string;
  sort_order: number;
  min_photos: number;
  is_payment_trigger: boolean;
  icon_name?: string;
  description?: string;
}

export interface IProductionUpdateRow {
  update_id?: number | null;
  step_id: number;
  step_code?: string;
  status: ProductionStepStatus;
  description?: string | null;
  image_urls?: string[];
  completed_at?: string | null;
  rejected_reason?: string | null;
  updated_by_user_id?: number | null;
  last_updated_at?: string | null;
}

export interface IProductionLockContext {
  deposit_amount?: number;
  deposit_currency?: string;
  deposit_due_date?: string;
  deposit_percent?: number;
  payment_url?: string;
  expired_at?: string;
}

export interface IProductionUpdatesBundle {
  order_id: number;
  order_status: string;
  updates: IProductionUpdateRow[];
  production_locked?: boolean;
  lock_reason?: string;
  lock_context?: IProductionLockContext;
  template_preview?: IProductionStepTemplate[];
}

export interface IMergedProductionStep {
  template: IProductionStepTemplate;
  update: IProductionUpdateRow;
}

export interface IProductionUpdateRequest {
  step_id: number;
  status: 'IP' | 'CD' | 'RJ' | 'PD';
  description?: string;
  image_urls: string[];
  confirm_payment_trigger?: boolean;
}
