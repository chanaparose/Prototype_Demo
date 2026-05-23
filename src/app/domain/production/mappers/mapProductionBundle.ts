import type { IProductionUpdatesBundleResponse } from '@/services/api/types/production.types';
import type {
  IMergedProductionStep,
  IProductionLockContext,
  IProductionStepTemplate,
  IProductionUpdateRow,
  IProductionUpdatesBundle,
  ProductionStepStatus,
} from '@/domain/production/types/production.model';
import { apiListAsRecords, asRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export function mapLockContextFromApi(raw: unknown): IProductionLockContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = asRecord(raw);
  return {
    deposit_amount: o.deposit_amount != null ? Number(o.deposit_amount) : undefined,
    deposit_currency: pickScalarString(o.deposit_currency) || undefined,
    deposit_due_date: pickScalarString(o.deposit_due_date) || undefined,
    deposit_percent: o.deposit_percent != null ? Number(o.deposit_percent) : undefined,
    payment_url: pickScalarString(o.payment_url) || undefined,
    expired_at: pickScalarString(o.expired_at) || undefined,
  };
}

export function mapStepTemplatesFromApi(raw: unknown): IProductionStepTemplate[] {
  const root = asRecord(raw);
  const arr = Array.isArray(root.steps) ? root.steps : Array.isArray(raw) ? raw : [];
  const out: IProductionStepTemplate[] = [];
  for (const row of arr) {
    const r = asRecord(row);
    const step_id = pickScalarNumber(r.step_id, r.id);
    if (step_id == null || step_id < 0) continue;
    out.push({
      step_id,
      step_code: pickScalarString(r.step_code),
      step_name_th:
        pickScalarString(r.step_name_th, r.step_name, r.name_th) || `ขั้น #${step_id}`,
      step_name_en: pickScalarString(r.step_name_en) || undefined,
      sort_order: pickScalarNumber(r.sort_order, r.sequence) ?? 0,
      min_photos: Math.max(0, pickScalarNumber(r.min_photos, r.minPhotos) ?? 0),
      is_payment_trigger: Boolean(r.is_payment_trigger ?? r.isPaymentTrigger),
      icon_name: pickScalarString(r.icon_name) || undefined,
      description: pickScalarString(r.description) || undefined,
    });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order);
}

export function mapProductionUpdateRowFromApi(row: ApiRecord): IProductionUpdateRow {
  const imgs = row.image_urls ?? row.imageUrls;
  const image_urls = Array.isArray(imgs)
    ? imgs
        .map((u) => (typeof u === 'string' ? u.trim() : pickScalarString(u)))
        .filter((u) => u.startsWith('http'))
    : pickScalarString(row.image_url)
      ? [pickScalarString(row.image_url)]
      : [];
  const st = pickScalarString(row.status, 'PD').toUpperCase();
  const status: ProductionStepStatus = st === 'IP' || st === 'CD' || st === 'RJ' ? st : 'PD';
  return {
    update_id: row.update_id != null ? pickScalarNumber(row.update_id) : null,
    step_id: pickScalarNumber(row.step_id, row.stepId) ?? 0,
    step_code: pickScalarString(row.step_code) || undefined,
    status,
    description: pickScalarString(row.description) || null,
    image_urls,
    completed_at: pickScalarString(row.completed_at) || null,
    rejected_reason: pickScalarString(row.rejected_reason) || null,
    updated_by_user_id:
      row.updated_by_user_id != null ? pickScalarNumber(row.updated_by_user_id) : null,
    last_updated_at: pickScalarString(row.last_updated_at) || null,
  };
}

export function mapProductionUpdatesBundleFromApi(
  b: IProductionUpdatesBundleResponse,
): IProductionUpdatesBundle {
  const template_preview = Array.isArray(b.template_preview)
    ? mapStepTemplatesFromApi({ steps: b.template_preview })
    : undefined;
  const updates = apiListAsRecords(b.updates).map(mapProductionUpdateRowFromApi);
  return {
    order_id: b.order_id,
    order_status: b.order_status,
    updates,
    production_locked: b.production_locked,
    lock_reason: pickScalarString(b.lock_reason) || undefined,
    lock_context: mapLockContextFromApi(b.lock_context),
    template_preview,
  };
}

export function mergeTemplateWithUpdates(
  templates: IProductionStepTemplate[],
  updates: IProductionUpdateRow[],
): IMergedProductionStep[] {
  const byStep = new Map<number, IProductionUpdateRow>();
  for (const u of updates) {
    if (Number.isFinite(u.step_id) && u.step_id >= 0) byStep.set(u.step_id, u);
  }
  return templates.map((t) => {
    const existing = byStep.get(t.step_id);
    const update: IProductionUpdateRow =
      existing ??
      ({
        step_id: t.step_id,
        step_code: t.step_code,
        status: 'PD',
        description: '',
        image_urls: [],
      } as IProductionUpdateRow);
    return { template: t, update: { ...update, step_code: update.step_code ?? t.step_code } };
  });
}
