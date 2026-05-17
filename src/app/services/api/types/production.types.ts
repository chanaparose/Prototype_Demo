export interface IProductionStepTemplateResponse {
  step_id: number;
  step_code?: string;
  step_name_th?: string;
  step_name_en?: string;
  step_name?: string;
  name_th?: string;
  sort_order?: number;
  sequence?: number;
  min_photos?: number;
  minPhotos?: number;
  is_payment_trigger?: boolean;
  isPaymentTrigger?: boolean;
  icon_name?: string;
  description?: string;
}

export interface IProductionUpdateRowResponse {
  update_id?: number | null;
  step_id: number;
  stepId?: number;
  step_code?: string;
  status?: string;
  description?: string | null;
  image_urls?: string[];
  imageUrls?: string[];
  image_url?: string;
  completed_at?: string | null;
  rejected_reason?: string | null;
  updated_by_user_id?: number | null;
  last_updated_at?: string | null;
}

export interface IProductionUpdatesBundleResponse {
  order_id: number;
  order_status: string;
  updates: IProductionUpdateRowResponse[];
  production_locked?: boolean;
  lock_reason?: string;
  lock_context?: Record<string, unknown>;
  template_preview?: IProductionStepTemplateResponse[];
}

export interface IProductionUpdateRequest {
  step_id: number;
  status: 'IP' | 'CD' | 'RJ' | 'PD';
  description?: string;
  image_urls: string[];
  confirm_payment_trigger?: boolean;
}
