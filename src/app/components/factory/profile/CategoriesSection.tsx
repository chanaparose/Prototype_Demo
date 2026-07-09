import React, { useState, useMemo, useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useProductCategories } from '@/hooks/master/useProductCategories';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import type { SubCategoryOption } from '@/hooks/master/useSubCategoriesByCategory';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { CategoryManageModal } from '@/components/factory/profile/CategoryManageModal';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { ProfileFormValues } from '@/components/factory/profile/ProfileFormTypes';

interface ApiCategory {
  category_id: number;
  name: string;
}

interface ApiSubCategory {
  sub_category_id: number;
  category_id: number;
  name?: string;
  sub_category_name?: string;
}

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  factoryId: number | string;
  /** Called by parent to register the "open category manager" handler */
  onRegisterAdd?: (handler: () => void) => void;
  /** Raw categories from /factories/me — used as fallback when master data is unavailable */
  apiCategories?: ApiCategory[];
  /** Raw sub_categories from /factories/me — used as fallback when master data is unavailable */
  apiSubCategories?: ApiSubCategory[];
  /**
   * Callback เพื่อส่ง Set ของ PD category IDs ที่ยังไม่ได้เลือก sub ให้ parent ใช้ validate
   * จะถูกเรียกทุกครั้งที่ค่าเปลี่ยน
   */
  onPdSubValidation?: (invalidCategoryIds: Set<number>) => void;
}

export function CategoriesSection({
  form,
  factoryId,
  onRegisterAdd,
  apiCategories = [],
  apiSubCategories = [],
  onPdSubValidation,
}: Props) {
  const { control } = form;
  const { data: allCategories = [] } = useProductCategories();
  const { data: pdCategories = [] } = useLbiCategoriesByScope('PD');
  const { data: mtCategories = [] } = useLbiCategoriesByScope('MT');
  const { data: hubs = [] } = useLbiHubsQuery();

  const categoryIds = form.watch('category_ids');
  const subCategoryIds = form.watch('sub_category_ids');

  const { byCategory: masterByCategory } = useSubCategoriesByCategories(categoryIds);

  // Build fallback maps from API data for when master data is unavailable
  const apiByCategoryMap = useMemo(() => {
    const map = new Map<number, SubCategoryOption[]>();
    for (const s of apiSubCategories) {
      const id = s.sub_category_id;
      const name = (s.sub_category_name ?? s.name ?? '').trim();
      if (!id || !name) continue;
      const list = map.get(s.category_id) ?? [];
      list.push({ id, name, categoryId: s.category_id });
      map.set(s.category_id, list);
    }
    return map;
  }, [apiSubCategories]);

  // Merge master + API fallback: prefer master data when available
  const byCategory = useMemo(() => {
    if (masterByCategory.size > 0) return masterByCategory;
    return apiByCategoryMap;
  }, [masterByCategory, apiByCategoryMap]);

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [focusCategoryId, setFocusCategoryId] = useState<number | null>(null);

  const openManageModal = (focusId: number | null = null) => {
    setFocusCategoryId(focusId);
    setManageModalOpen(true);
  };

  // Register the add handler with parent once on mount
  useEffect(() => {
    onRegisterAdd?.(() => openManageModal(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a lookup from API categories for fallback name resolution
  const apiCategoryMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of apiCategories) map.set(c.category_id, c.name);
    return map;
  }, [apiCategories]);

  const resolvedCategories = useMemo(() => {
    // Collect all category IDs: from form + from API (in case form hasn't been seeded yet)
    const allIds = Array.from(
      new Set([...categoryIds, ...apiCategories.map((c) => c.category_id)]),
    );
    return allIds
      .map((cid) => {
        const masterName = allCategories.find((c) => c.id === cid)?.name;
        const name = masterName ?? apiCategoryMap.get(cid) ?? '';
        if (!name) return null;
        return { id: cid, name };
      })
      .filter((c): c is { id: number; name: string } => c != null);
  }, [categoryIds, allCategories, apiCategories, apiCategoryMap]);

  const pdIds = useMemo(() => new Set(pdCategories.map((c) => c.id)), [pdCategories]);
  const mtIds = useMemo(() => new Set(mtCategories.map((c) => c.id)), [mtCategories]);

  // category_id → hub, ใช้จัดกลุ่ม hub -> category -> subcategory
  const hubByCategoryId = useMemo(() => {
    const map = new Map<number, (typeof hubs)[number]>();
    for (const h of hubs) {
      for (const c of h.categories) map.set(c.category_id, h);
    }
    return map;
  }, [hubs]);

  const groupedByHub = useMemo(() => {
    const groups = new Map<
      number,
      { hub: (typeof hubs)[number]; categories: { id: number; name: string }[] }
    >();
    const unknown: { id: number; name: string }[] = [];
    for (const c of resolvedCategories) {
      const hub = hubByCategoryId.get(c.id);
      if (!hub) {
        unknown.push(c);
        continue;
      }
      const bucket = groups.get(hub.hub_id) ?? { hub, categories: [] };
      bucket.categories.push(c);
      groups.set(hub.hub_id, bucket);
    }
    const sorted = [...groups.values()].sort((a, b) => a.hub.name.localeCompare(b.hub.name, 'th'));
    return { hubs: sorted, unknown };
  }, [resolvedCategories, hubByCategoryId]);

  // PD categories ที่ไม่มี sub-category เลือกไว้เลย (ใช้สำหรับ validation + highlight)
  const pdCatsWithNoSubs = useMemo(() => {
    return new Set(
      categoryIds.filter((cid) => {
        if (mtIds.has(cid)) return false; // ไม่ใช่ PD
        const subsAvailable = (byCategory.get(cid) ?? []).length;
        if (subsAvailable === 0) return false; // ไม่มี sub ให้เลือก = ไม่นับ
        const subsSelected = (byCategory.get(cid) ?? []).filter((s) =>
          subCategoryIds.includes(s.id),
        ).length;
        return subsSelected === 0;
      }),
    );
  }, [categoryIds, subCategoryIds, byCategory, mtIds]);

  // แจ้ง parent เมื่อ validation state เปลี่ยน
  useEffect(() => {
    onPdSubValidation?.(pdCatsWithNoSubs);
  }, [pdCatsWithNoSubs, onPdSubValidation]);

  const removeCategoryFromForm = (cid: number) => {
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
  };

  const renderSheetRows = (rows: { id: number; name: string }[], isMTGroup = false) =>
    rows.map((c) => {
      const isMT = isMTGroup || mtIds.has(c.id);
      const selectedHere = (byCategory.get(c.id) ?? []).filter((s) =>
        subCategoryIds.includes(s.id),
      );
      const hasSubError = !isMT && pdCatsWithNoSubs.has(c.id);

      return (
        <tr key={c.id} className={hasSubError ? 'bg-red-50/50' : 'hover:bg-slate-50/70'}>
          <td className='border-b border-slate-100 px-3 py-3 align-top'>
            <p className='text-sm font-bold text-slate-900'>{c.name}</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isMT ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-brand-purple'
              }`}
            >
              {isMT ? 'วัตถุดิบ (MT)' : 'รับผลิต (PD)'}
            </span>
          </td>
          <td className='border-b border-slate-100 px-3 py-3 align-top'>
            {isMT ? (
              <span className='text-xs font-medium text-slate-400'>ไม่ต้องเลือกหมวดย่อย</span>
            ) : selectedHere.length > 0 ? (
              <div className='flex flex-wrap gap-1.5'>
                {selectedHere.map((s) => (
                  <span
                    key={s.id}
                    className='inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800'
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className='text-xs font-semibold text-red-500'>ยังไม่ได้เลือกหมวดย่อย</span>
            )}
          </td>
          <td className='border-b border-slate-100 px-3 py-3 text-right align-top'>
            <div className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm'>
              {!isMT ? (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => openManageModal(c.id)}
                  className='inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-slate-600 hover:bg-violet-50 hover:text-brand-purple'
                >
                  <Pencil size={12} /> แก้
                </Button>
              ) : null}
              <Button
                variant='unstyled'
                type='button'
                onClick={() => removeCategoryFromForm(c.id)}
                className='inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-red-500 hover:bg-red-50'
              >
                <Trash2 size={12} /> ลบ
              </Button>
            </div>
          </td>
        </tr>
      );
    });

  const renderScopeTable = (
    title: string,
    scope: 'PD' | 'MT',
    groups: typeof groupedByHub.hubs,
  ) => {
    const isMT = scope === 'MT';
    const rowCount = groups.reduce((sum, item) => sum + item.categories.length, 0);

    return (
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div
          className={`flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 ${
            isMT ? 'bg-emerald-50/70' : 'bg-violet-50/70'
          }`}
        >
          <div>
            <p
              className={`text-sm font-extrabold ${isMT ? 'text-emerald-700' : 'text-brand-purple'}`}
            >
              {title}
            </p>
            <p className='text-[11px] font-medium text-slate-500'>
              {rowCount > 0 ? `${rowCount} หมวดหลัก` : 'ยังไม่มีข้อมูล'}
            </p>
          </div>
        </div>

        {rowCount > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[640px] border-collapse'>
              <thead>
                <tr className='bg-slate-50 text-left'>
                  <th className='border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500'>
                    Hub / หมวดหลัก
                  </th>
                  <th className='border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500'>
                    หมวดย่อยที่รับงาน
                  </th>
                  <th className='w-[130px] border-b border-slate-200 px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map(({ hub, categories }) => (
                  <React.Fragment key={hub.hub_id}>
                    <tr>
                      <td
                        colSpan={3}
                        className={`border-b border-slate-100 px-3 py-2 text-xs font-extrabold ${
                          isMT
                            ? 'bg-emerald-50/40 text-emerald-700'
                            : 'bg-violet-50/40 text-brand-purple'
                        }`}
                      >
                        {hub.name}
                      </td>
                    </tr>
                    {renderSheetRows(categories, hub.scope === 'MT')}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='px-3 py-5 text-sm text-slate-400'>ยังไม่ได้เลือกหมวดใน scope นี้</div>
        )}
      </div>
    );
  };

  const pdGroups = groupedByHub.hubs.filter(({ hub }) => hub.scope !== 'MT');
  const mtGroups = groupedByHub.hubs.filter(({ hub }) => hub.scope === 'MT');

  return (
    <div>
      {resolvedCategories.length === 0 ? (
        <div className='border border-dashed border-gray-300 rounded-lg p-6 text-center'>
          <p className='text-sm text-gray-500'>ยังไม่ได้เลือกหมวดหมู่</p>
          <p className='text-xs text-gray-400 mt-1'>กด [จัดการหมวดหมู่] เพื่อเพิ่ม Hub แรก</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {renderScopeTable('หมวดสินค้า / รับผลิต (PD)', 'PD', pdGroups)}
          {renderScopeTable('หมวดวัตถุดิบ (MT)', 'MT', mtGroups)}
          {groupedByHub.unknown.length > 0 ? (
            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
              <div className='border-b border-slate-100 bg-slate-50 px-3 py-2.5'>
                <p className='text-sm font-extrabold text-slate-600'>หมวดอื่นๆ</p>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[640px] border-collapse'>
                  <tbody>{renderSheetRows(groupedByHub.unknown)}</tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Controller
        control={control}
        name='category_ids'
        render={({ field }) => <input type='hidden' name={field.name} />}
      />
      <Controller
        control={control}
        name='sub_category_ids'
        render={({ field }) => <input type='hidden' name={field.name} />}
      />

      <CategoryManageModal
        open={manageModalOpen}
        initialCategoryIds={categoryIds}
        initialSubCategoryIds={subCategoryIds}
        focusCategoryId={focusCategoryId}
        onClose={() => {
          setManageModalOpen(false);
          setFocusCategoryId(null);
        }}
        onConfirm={(nextCategoryIds, nextSubCategoryIds) => {
          form.setValue('category_ids', nextCategoryIds, { shouldDirty: true });
          form.setValue('sub_category_ids', nextSubCategoryIds, { shouldDirty: true });
          setManageModalOpen(false);
          setFocusCategoryId(null);
        }}
      />
    </div>
  );
}
