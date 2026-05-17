export type ProductionStepStatus = 'PD' | 'IP' | 'CD' | 'RJ';

export interface ProductionStepTemplate {
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

export interface ProductionUpdateRow {
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

export interface ProductionLockContext {
  deposit_amount?: number;
  deposit_currency?: string;
  deposit_due_date?: string;
  deposit_percent?: number;
  payment_url?: string;
  expired_at?: string;
}

export function parseLockContextFromApi(raw: unknown): ProductionLockContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  return {
    deposit_amount: o.deposit_amount != null ? Number(o.deposit_amount) : undefined,
    deposit_currency: o.deposit_currency != null ? String(o.deposit_currency) : undefined,
    deposit_due_date: o.deposit_due_date != null ? String(o.deposit_due_date) : undefined,
    deposit_percent: o.deposit_percent != null ? Number(o.deposit_percent) : undefined,
    payment_url: o.payment_url != null ? String(o.payment_url) : undefined,
    expired_at: o.expired_at != null ? String(o.expired_at) : undefined,
  };
}

export interface ProductionUpdatesBundle {
  order_id: number;
  order_status: string;
  updates: ProductionUpdateRow[];

  production_locked?: boolean;
  lock_reason?: string;
  lock_context?: ProductionLockContext;

  template_preview?: ProductionStepTemplate[];
}

export interface MergedProductionStep {
  template: ProductionStepTemplate;
  update: ProductionUpdateRow;
}

export function parseStepTemplates(raw: unknown): ProductionStepTemplate[] {
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const arr = Array.isArray(root.steps) ? root.steps : Array.isArray(raw) ? (raw as unknown[]) : [];
  const out: ProductionStepTemplate[] = [];
  for (const row of arr) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const step_id = Number(r.step_id ?? r.id);
    if (!Number.isFinite(step_id) || step_id <= 0) continue;
    out.push({
      step_id,
      step_code: String(r.step_code ?? ''),
      step_name_th:
        String(r.step_name_th ?? r.step_name ?? r.name_th ?? '').trim() || `ขั้น #${step_id}`,
      step_name_en: r.step_name_en != null ? String(r.step_name_en) : undefined,
      sort_order: Number(r.sort_order ?? r.sequence ?? 0) || 0,
      min_photos: Math.max(0, Number(r.min_photos ?? r.minPhotos ?? 0) || 0),
      is_payment_trigger: Boolean(r.is_payment_trigger ?? r.isPaymentTrigger),
      icon_name: r.icon_name != null ? String(r.icon_name) : undefined,
      description: r.description != null ? String(r.description) : undefined,
    });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order);
}

export function parseUpdateRow(row: Record<string, unknown>): ProductionUpdateRow {
  const imgs = row.image_urls ?? row.imageUrls;
  const image_urls = Array.isArray(imgs)
    ? imgs.map((u) => String(u)).filter((u) => u.startsWith('http'))
    : row.image_url
      ? [String(row.image_url)]
      : [];
  const st = String(row.status ?? 'PD').toUpperCase();
  const status: ProductionStepStatus = st === 'IP' || st === 'CD' || st === 'RJ' ? st : 'PD';
  return {
    update_id: row.update_id != null ? Number(row.update_id) : null,
    step_id: Number(row.step_id ?? row.stepId ?? 0),
    step_code: row.step_code != null ? String(row.step_code) : undefined,
    status,
    description: row.description != null ? String(row.description) : null,
    image_urls,
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    rejected_reason: row.rejected_reason != null ? String(row.rejected_reason) : null,
    updated_by_user_id: row.updated_by_user_id != null ? Number(row.updated_by_user_id) : null,
    last_updated_at: row.last_updated_at != null ? String(row.last_updated_at) : null,
  };
}

export function mergeTemplateWithUpdates(
  templates: ProductionStepTemplate[],
  updates: ProductionUpdateRow[],
): MergedProductionStep[] {
  const byStep = new Map<number, ProductionUpdateRow>();
  for (const u of updates) {
    if (Number.isFinite(u.step_id) && u.step_id > 0) byStep.set(u.step_id, u);
  }
  return templates.map((t) => {
    const existing = byStep.get(t.step_id);
    const update: ProductionUpdateRow =
      existing ??
      ({
        step_id: t.step_id,
        step_code: t.step_code,
        status: 'PD',
        description: '',
        image_urls: [],
      } as ProductionUpdateRow);
    return { template: t, update: { ...update, step_code: update.step_code ?? t.step_code } };
  });
}
