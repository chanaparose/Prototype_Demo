import type { ProfileFormValues } from './ProfileFormTypes';

type Row = Record<string, unknown>;

export interface ProfileRawBundle {
  factory: Row;
  categoryIds: number[];
  subCategoryIds: number[];
}

export function mapProfileRawToForm(raw: ProfileRawBundle): ProfileFormValues {
  const f = raw.factory;
  return {
    factory_name: String(f.factory_name ?? f.name ?? '').trim(),
    tax_id: String(f.tax_id ?? '').trim(),
    description: String(f.description ?? '').trim(),
    factory_type_id: (() => {
      const v = Number(f.factory_type_id);
      return Number.isFinite(v) && v > 0 ? v : null;
    })(),
    category_ids: [...raw.categoryIds].sort((a, b) => a - b),
    sub_category_ids: [...raw.subCategoryIds].sort((a, b) => a - b),
  };
}
