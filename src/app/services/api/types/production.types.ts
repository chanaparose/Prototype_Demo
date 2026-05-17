export type IProductionUpdateRequest = Record<string, unknown>;

export interface IProductionUpdatesBundleResponse {
  order_id: number;
  order_status: string;
  updates: unknown[];
  production_locked?: boolean;
  lock_reason?: string;
  lock_context?: unknown;
  template_preview?: unknown[];
}
