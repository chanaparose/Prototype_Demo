import React, { useState, useMemo, useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useProductCategories } from '../../../hooks/master/useProductCategories';
import { useLbiCategoriesByScope } from '../../../hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '../../../hooks/master/useSubCategoriesByCategory';
import { CategoryCard } from './CategoryCard';
import { CategoryPickerModal } from './CategoryPickerModal';
import { SubCategoryPickerModal } from './SubCategoryPickerModal';
import type { ProfileFormValues } from './ProfileFormTypes';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  factoryId: number | string;
  /** Called by parent to register the "open category picker" handler */
  onRegisterAdd?: (handler: () => void) => void;
}

export function CategoriesSection({ form, factoryId, onRegisterAdd }: Props) {
  const { control } = form;
  const { data: allCategories = [] } = useProductCategories();
  const { data: pdCategories = [] } = useLbiCategoriesByScope('PD');
  const { data: mtCategories = [] } = useLbiCategoriesByScope('MT');

  const categoryIds = form.watch('category_ids');
  const subCategoryIds = form.watch('sub_category_ids');

  const { byCategory } = useSubCategoriesByCategories(categoryIds);

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const openCategoryPicker = () => setCategoryPickerOpen(true);

  // Register the add handler with parent once on mount
  useEffect(() => {
    onRegisterAdd?.(openCategoryPicker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editingCategoryName = useMemo(() => {
    if (editingCategoryId == null) return '';
    return allCategories.find((c) => c.id === editingCategoryId)?.name ?? '';
  }, [editingCategoryId, allCategories]);

  const resolvedCategories = categoryIds
    .map((cid) => allCategories.find((c) => c.id === cid))
    .filter((c): c is { id: number; name: string } => c != null);

  const pdIds = useMemo(() => new Set(pdCategories.map((c) => c.id)), [pdCategories]);
  const mtIds = useMemo(() => new Set(mtCategories.map((c) => c.id)), [mtCategories]);

  const groupedCategories = useMemo(() => {
    const pd: { id: number; name: string }[] = [];
    const mt: { id: number; name: string }[] = [];
    const unknown: { id: number; name: string }[] = [];
    for (const c of resolvedCategories) {
      if (pdIds.has(c.id)) pd.push(c);
      else if (mtIds.has(c.id)) mt.push(c);
      else unknown.push(c);
    }
    return { pd, mt, unknown };
  }, [resolvedCategories, pdIds, mtIds]);

  const renderCategoryGrid = (rows: { id: number; name: string }[]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((c) => (
        <CategoryCard
          key={c.id}
          factoryId={factoryId}
          categoryId={c.id}
          categoryName={c.name}
          subCategoriesForCategory={byCategory.get(c.id) ?? []}
          selectedSubIds={subCategoryIds}
          onEditSubs={(cid) => setEditingCategoryId(cid)}
          onRemove={(cid) => {
            const subsInCategory = (byCategory.get(cid) ?? []).map((s) => s.id);
            form.setValue(
              'category_ids',
              categoryIds.filter((x) => x !== cid),
              { shouldDirty: true },
            );
            form.setValue(
              'sub_category_ids',
              subCategoryIds.filter((x) => !subsInCategory.includes(x)),
              { shouldDirty: true },
            );
          }}
        />
      ))}
    </div>
  );

  return (
    <div>
      {resolvedCategories.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500">ยังไม่ได้เลือกหมวดหมู่</p>
          <p className="text-xs text-gray-400 mt-1">กด [+ เพิ่มหมวดหมู่] เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-indigo-700 mb-2">หมวดสินค้า (PD)</p>
            {groupedCategories.pd.length > 0 ? (
              renderCategoryGrid(groupedCategories.pd)
            ) : (
              <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-2 text-xs text-indigo-500">
                ยังไม่ได้เลือกหมวด PD
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-2">หมวดวัตถุดิบ (MT)</p>
            {groupedCategories.mt.length > 0 ? (
              renderCategoryGrid(groupedCategories.mt)
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-2 text-xs text-emerald-600">
                ยังไม่ได้เลือกหมวด MT
              </div>
            )}
          </div>

          {groupedCategories.unknown.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">หมวดอื่นๆ</p>
              {renderCategoryGrid(groupedCategories.unknown)}
            </div>
          ) : null}
        </div>
      )}

      <Controller control={control} name="category_ids" render={() => <input type="hidden" />} />
      <Controller control={control} name="sub_category_ids" render={() => <input type="hidden" />} />

      <CategoryPickerModal
        open={categoryPickerOpen}
        initialSelected={categoryIds}
        onClose={() => setCategoryPickerOpen(false)}
        onConfirm={(nextIds) => {
          const stillValidParents = new Set(nextIds);
          const prunedSubIds = subCategoryIds.filter((sid) => {
            for (const [cid, subs] of byCategory.entries()) {
              if (subs.some((s) => s.id === sid)) {
                return stillValidParents.has(cid);
              }
            }
            return true;
          });
          form.setValue('category_ids', nextIds, { shouldDirty: true });
          form.setValue('sub_category_ids', prunedSubIds, { shouldDirty: true });
          setCategoryPickerOpen(false);
        }}
      />

      <SubCategoryPickerModal
        open={editingCategoryId != null}
        categoryId={editingCategoryId}
        categoryName={editingCategoryName}
        initialSelected={subCategoryIds}
        onClose={() => setEditingCategoryId(null)}
        onConfirm={(next) => {
          form.setValue('sub_category_ids', next, { shouldDirty: true });
          setEditingCategoryId(null);
        }}
      />
    </div>
  );
}
