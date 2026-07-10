import React, { Fragment, useState, useMemo, useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useProductCategories } from '@/hooks/master/useProductCategories';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import type { SubCategoryOption } from '@/hooks/master/useSubCategoriesByCategory';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { CategoryManageModal } from '@/components/factory/profile/CategoryManageModal';
import { selectedSubNames } from '@/components/factory/profile/subCategoryPicker.utils';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@lib/utils';
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
  onRegisterAdd,
  apiCategories = [],
  apiSubCategories = [],
  onPdSubValidation,
}: Props) {
  const { control } = form;
  const { data: allCategories = [] } = useProductCategories();
  const { data: mtCategories = [] } = useLbiCategoriesByScope('MT');
  const { data: hubs = [] } = useLbiHubsQuery();

  const categoryIds = form.watch('category_ids');
  const subCategoryIds = form.watch('sub_category_ids');

  const { byCategory: masterByCategory } = useSubCategoriesByCategories(categoryIds);

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

  useEffect(() => {
    onRegisterAdd?.(() => openManageModal(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apiCategoryMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of apiCategories) map.set(c.category_id, c.name);
    return map;
  }, [apiCategories]);

  const resolvedCategories = useMemo(() => {
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

  const mtIds = useMemo(() => new Set(mtCategories.map((c) => c.id)), [mtCategories]);

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

  const pdCatsWithNoSubs = useMemo(() => {
    return new Set(
      categoryIds.filter((cid) => {
        if (mtIds.has(cid)) return false;
        const subsAvailable = (byCategory.get(cid) ?? []).length;
        if (subsAvailable === 0) return false;
        const subsSelected = (byCategory.get(cid) ?? []).filter((s) =>
          subCategoryIds.includes(s.id),
        ).length;
        return subsSelected === 0;
      }),
    );
  }, [categoryIds, subCategoryIds, byCategory, mtIds]);

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

  const thClass =
    'border border-gray-300 bg-gray-100 px-2.5 py-2 text-left text-[11px] font-semibold text-gray-600 whitespace-nowrap';
  const tdClass = 'border border-gray-200 px-2.5 py-2 text-xs text-gray-800 align-top';

  const renderScopeTable = (
    title: string,
    scope: 'PD' | 'MT',
    groups: typeof groupedByHub.hubs,
  ) => {
    const isMTScope = scope === 'MT';
    const rowCount = groups.reduce((sum, item) => sum + item.categories.length, 0);

    return (
      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5',
            isMTScope ? 'bg-emerald-50/70' : 'bg-violet-50/70',
          )}
        >
          <div>
            <p
              className={cn(
                'text-sm font-extrabold',
                isMTScope ? 'text-emerald-700' : 'text-brand-purple',
              )}
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
            <table
              className={cn(
                'w-full border-collapse bg-white',
                isMTScope ? 'min-w-[360px]' : 'min-w-[520px]',
              )}
            >
              <thead>
                <tr>
                  <th className={thClass}>Hub</th>
                  <th className={thClass}>หมวดหมู่</th>
                  {!isMTScope ? (
                    <th className={cn(thClass, 'min-w-[140px]')}>หมวดย่อย</th>
                  ) : null}
                  <th className={cn(thClass, 'w-16 text-center')}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(({ hub, categories }) =>
                  categories.map((c, idx) => {
                    const isMT = isMTScope || hub.scope === 'MT' || mtIds.has(c.id);
                    const names = selectedSubNames(subCategoryIds, byCategory.get(c.id) ?? []);
                    const hasSubError = !isMT && pdCatsWithNoSubs.has(c.id);
                    const isFirstInHub = idx === 0;

                    return (
                      <tr
                        key={c.id}
                        className={cn(hasSubError && 'bg-red-50/50', 'hover:bg-slate-50/50')}
                      >
                        {isFirstInHub ? (
                          <td
                            className={cn(tdClass, 'font-medium')}
                            rowSpan={categories.length}
                          >
                            <span
                              className={cn(
                                'font-semibold',
                                isMTScope ? 'text-emerald-700' : 'text-brand-purple',
                              )}
                            >
                              {hub.name}
                            </span>
                          </td>
                        ) : null}
                        <td className={cn(tdClass, 'font-medium')}>{c.name}</td>
                        {!isMTScope ? (
                          <td className={tdClass}>
                            {names.length > 0 ? (
                              <span className='text-[11px] leading-relaxed text-gray-700'>
                                {names.join(', ')}
                              </span>
                            ) : (byCategory.get(c.id) ?? []).length > 0 ? (
                              <span className='text-[11px] font-medium text-red-500'>
                                ยังไม่ได้เลือก
                              </span>
                            ) : (
                              <span className='text-[11px] text-gray-400'>—</span>
                            )}
                          </td>
                        ) : null}
                        <td className={cn(tdClass, 'text-center')}>
                          <div className='inline-flex items-center gap-0.5'>
                            {!isMT ? (
                              <Button
                                type='button'
                                variant='unstyled'
                                onClick={() => openManageModal(c.id)}
                                className='rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-brand-purple'
                                aria-label={`แก้ไข ${c.name}`}
                              >
                                <Pencil size={13} />
                              </Button>
                            ) : null}
                            <Button
                              type='button'
                              variant='unstyled'
                              onClick={() => removeCategoryFromForm(c.id)}
                              className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'
                              aria-label={`ลบ ${c.name}`}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                )}
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
            <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
              <div className='border-b border-slate-100 bg-slate-50 px-3 py-2.5'>
                <p className='text-sm font-extrabold text-slate-600'>หมวดอื่นๆ</p>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[360px] border-collapse bg-white'>
                  <thead>
                    <tr>
                      <th className={thClass}>หมวดหมู่</th>
                      <th className={cn(thClass, 'min-w-[140px]')}>หมวดย่อย</th>
                      <th className={cn(thClass, 'w-16 text-center')}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByHub.unknown.map((c) => {
                      const isMT = mtIds.has(c.id);
                      const names = selectedSubNames(subCategoryIds, byCategory.get(c.id) ?? []);
                      return (
                        <Fragment key={c.id}>
                          <tr>
                            <td className={cn(tdClass, 'font-medium')}>{c.name}</td>
                            <td className={tdClass}>
                              {isMT ? (
                                <span className='text-[11px] text-gray-400'>—</span>
                              ) : names.length > 0 ? (
                                <span className='text-[11px] leading-relaxed text-gray-700'>
                                  {names.join(', ')}
                                </span>
                              ) : (
                                <span className='text-[11px] font-medium text-red-500'>
                                  ยังไม่ได้เลือก
                                </span>
                              )}
                            </td>
                            <td className={cn(tdClass, 'text-center')}>
                              <div className='inline-flex items-center gap-0.5'>
                                {!isMT ? (
                                  <Button
                                    type='button'
                                    variant='unstyled'
                                    onClick={() => openManageModal(c.id)}
                                    className='rounded p-1 text-gray-500 hover:bg-gray-100'
                                  >
                                    <Pencil size={13} />
                                  </Button>
                                ) : null}
                                <Button
                                  type='button'
                                  variant='unstyled'
                                  onClick={() => removeCategoryFromForm(c.id)}
                                  className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
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
