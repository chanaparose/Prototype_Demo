import React, { useState, useMemo, useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useProductCategories } from '@/hooks/master/useProductCategories';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import type { SubCategoryOption } from '@/hooks/master/useSubCategoriesByCategory';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { selectedSubNames, subsForDisplay } from '@/components/factory/profile/subCategoryPicker.utils';
import { SubCategoryPickerField } from '@/components/factory/profile/SubCategoryPickerField';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@lib/utils';
import type { ProfileFormValues } from '@/components/factory/profile/ProfileFormTypes';
import type { IHubResponse } from '@/services/api/types/master.types';

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
  /** Preview and edit share the same table. Actions only appear in edit mode. */
  editable?: boolean;
  /** Called by parent to register a quick "add" handler (defaults to add-PD). */
  onRegisterAdd?: (handler: () => void) => void;
  apiCategories?: ApiCategory[];
  apiSubCategories?: ApiSubCategory[];
  /** ส่ง Set ของ PD category IDs ที่ยังไม่ได้เลือกหมวดย่อยให้ parent ใช้ block save */
  onPdSubValidation?: (invalidCategoryIds: Set<number>) => void;
  /** เผื่อ flow เดิมที่ save ทันที — ไม่ใช้แล้วใน /factory/info (save ผ่านปุ่มการ์ด) */
  onSaved?: (categoryIds: number[], subCategoryIds: number[]) => void | Promise<void>;
}

type Scope = 'PD' | 'MT';
/**
 * แถวร่างสำหรับเพิ่มหมวดใหม่ (ทีละ 1 แถว) แบบ Excel
 * lockedHub = true → เพิ่มหมวดใน Hub ที่มีอยู่แล้ว (ไม่ต้องเลือก hub ซ้ำ)
 */
type DraftRow = {
  scope: Scope;
  hubId: number | null;
  categoryId: number | null;
  subIds: number[];
  lockedHub: boolean;
};

export function CategoriesSection({
  form,
  editable = true,
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

  // ── inline add-row draft ─────────────────────────────────────────────────────
  const [draft, setDraft] = useState<DraftRow | null>(null);

  // โหลดหมวดย่อยของหมวดที่เลือกไว้ + หมวดในแถวร่าง (เพื่อโชว์ตัวเลือกหมวดย่อยได้ทันที)
  const subFetchIds = useMemo(() => {
    const s = new Set<number>(categoryIds);
    if (draft?.categoryId != null) s.add(draft.categoryId);
    return [...s];
  }, [categoryIds, draft?.categoryId]);
  const { byCategory: masterByCategory, isLoading: subsLoading } =
    useSubCategoriesByCategories(subFetchIds);

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

  const apiCategoryMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of apiCategories) map.set(c.category_id, c.name);
    return map;
  }, [apiCategories]);

  const resolvedCategories = useMemo(() => {
    const allIds = Array.from(new Set([...categoryIds, ...apiCategories.map((c) => c.category_id)]));
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

  // ทำความสะอาดข้อมูลเก่า: หมวดไหนเลือก "ทั้งหมด" (sort_order 99) ให้ตัด sub เฉพาะออก
  // (บังคับ exclusive) — รันเมื่อ master sub โหลดครบ เพื่อให้รู้ว่าตัวไหนคือ "ทั้งหมด"
  useEffect(() => {
    if (masterByCategory.size === 0) return;
    let next = subCategoryIds;
    for (const subs of masterByCategory.values()) {
      next = subsForDisplay(next, subs);
    }
    if (next.length !== subCategoryIds.length) {
      form.setValue('sub_category_ids', next, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterByCategory, subCategoryIds]);

  // ── mutations ───────────────────────────────────────────────────────────────
  const removeCategoryFromForm = (cid: number) => {
    const subsInCategory = (byCategory.get(cid) ?? []).map((s) => s.id);
    form.setValue('category_ids', categoryIds.filter((x) => x !== cid), { shouldDirty: true });
    form.setValue(
      'sub_category_ids',
      subCategoryIds.filter((x) => !subsInCategory.includes(x)),
      { shouldDirty: true },
    );
  };

  const setCategorySubs = (next: number[]) => {
    form.setValue('sub_category_ids', next, { shouldDirty: true });
  };

  const hubsForScope = (scope: Scope) => hubs.filter((h) => h.scope === scope);
  const availableCatsInHub = (hub: (typeof hubs)[number]) =>
    hub.categories.filter((c) => !categoryIds.includes(c.category_id));

  /** จัดกลุ่มหมวดที่เลือกไว้ตาม Hub (Hub เดียวกันอยู่กลุ่มเดียว) */
  const scopeGroups = (scope: Scope) => {
    const map = new Map<number | 'other', { hub: (typeof hubs)[number] | null; cats: { id: number; name: string }[] }>();
    for (const c of resolvedCategories) {
      const hub = hubByCategoryId.get(c.id) ?? null;
      const isMT = hub ? hub.scope === 'MT' : mtIds.has(c.id);
      if ((scope === 'MT') !== isMT) continue;
      const key = hub?.hub_id ?? 'other';
      const bucket = map.get(key) ?? { hub, cats: [] };
      bucket.cats.push(c);
      map.set(key, bucket);
    }
    const groups = [...map.values()];
    groups.sort((a, b) => (a.hub?.name ?? 'zzz').localeCompare(b.hub?.name ?? 'zzz', 'th'));
    groups.forEach((g) => g.cats.sort((a, b) => a.name.localeCompare(b.name, 'th')));
    return groups;
  };

  // เพิ่มหมวดใน Hub ใหม่ (ต้องเลือก hub เอง)
  const startAdd = (scope: Scope) => {
    const firstHub = hubsForScope(scope).find((h) => availableCatsInHub(h).length > 0) ?? null;
    setDraft({ scope, hubId: firstHub?.hub_id ?? null, categoryId: null, subIds: [], lockedHub: false });
  };
  // เพิ่มหมวดใน Hub ที่มีอยู่แล้ว (hub ล็อก)
  const startAddInHub = (scope: Scope, hubId: number) => {
    setDraft({ scope, hubId, categoryId: null, subIds: [], lockedHub: true });
  };
  const cancelAdd = () => setDraft(null);

  const draftHub = useMemo(
    () => (draft?.hubId != null ? hubs.find((h) => h.hub_id === draft.hubId) ?? null : null),
    [hubs, draft?.hubId],
  );
  const draftCatSubs = draft?.categoryId != null ? byCategory.get(draft.categoryId) ?? [] : [];
  const draftNeedsSub = draft?.scope === 'PD' && draftCatSubs.length > 0;
  const draftValid = draft?.categoryId != null && (!draftNeedsSub || draft.subIds.length > 0);

  const commitAdd = () => {
    if (!draft || draft.categoryId == null || !draftValid) return;
    form.setValue(
      'category_ids',
      [...new Set([...categoryIds, draft.categoryId])].sort((a, b) => a - b),
      { shouldDirty: true },
    );
    if (draft.scope === 'PD' && draft.subIds.length > 0) {
      form.setValue(
        'sub_category_ids',
        [...new Set([...subCategoryIds, ...draft.subIds])].sort((a, b) => a - b),
        { shouldDirty: true },
      );
    }
    setDraft(null);
  };

  useEffect(() => {
    if (editable) onRegisterAdd?.(() => startAdd('PD'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable]);

  // ── styling ─────────────────────────────────────────────────────────────────
  const thClass =
    'border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-bold text-slate-500 whitespace-nowrap';
  const tdClass = 'border-b border-slate-100 px-3 py-2.5 text-xs text-slate-700 align-middle';

  const renderScope = (title: string, scope: Scope) => {
    const isMT = scope === 'MT';
    const colCount = isMT ? 3 : 4;
    const groups = scopeGroups(scope);
    const totalCats = groups.reduce((s, g) => s + g.cats.length, 0);
    const isDrafting = draft?.scope === scope;
    // draft ที่ล็อก hub → แทรกในกลุ่มนั้น; draft ที่ไม่ล็อก → แถวเดี่ยวด้านล่าง (มี hub select)
    const draftInHubId = isDrafting && draft.lockedHub ? draft.hubId : null;
    const bottomDrafting = isDrafting && !draft.lockedHub;

    const hubBadge = (name: string) => (
      <span
        className={cn(
          'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold',
          isMT ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700',
        )}
      >
        {name}
      </span>
    );

    const subCell = (catId: number, subs: SubCategoryOption[], hasSubError: boolean) =>
      editable ? (
        <SubCategoryCellPicker
          subs={subs}
          selectedIds={subCategoryIds}
          onChange={setCategorySubs}
          isLoading={subsLoading}
          invalid={hasSubError}
        />
      ) : (
        <ReadonlySubNames names={selectedSubNames(subCategoryIds, subs)} hasSubs={subs.length > 0} />
      );

    return (
      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
        {/* header */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3',
            isMT ? 'bg-emerald-50/60' : 'bg-indigo-50/60',
          )}
        >
          <div className='flex items-center gap-3'>
            <span
              className={cn(
                'inline-flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[11px] font-extrabold',
                isMT ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700',
              )}
            >
              {scope}
            </span>
            <div>
              <p className={cn('text-sm font-bold', isMT ? 'text-emerald-800' : 'text-indigo-900')}>
                {title}
              </p>
              <p className='text-[11px] font-medium text-slate-500'>
                {totalCats > 0 ? `${totalCats} หมวดหลัก · ${groups.length} Hub` : 'ยังไม่มีข้อมูล'}
              </p>
            </div>
          </div>
        </div>

        {/* table */}
        <div className='overflow-x-auto'>
          <table className={cn('w-full border-collapse bg-white', isMT ? 'min-w-[420px]' : 'min-w-[560px]')}>
            <thead>
              <tr>
                <th className={cn(thClass, 'w-[26%]')}>Hub</th>
                <th className={thClass}>หมวดหลัก</th>
                {!isMT ? <th className={cn(thClass, 'min-w-[220px]')}>หมวดย่อยที่รับงาน</th> : null}
                {editable ? <th className={cn(thClass, 'w-24 text-center')}>จัดการ</th> : null}
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 && !bottomDrafting ? (
                <tr>
                  <td colSpan={colCount} className='px-3 py-5 text-center text-sm text-slate-400'>
                    ยังไม่ได้เลือกหมวดใน scope นี้ — กด “เพิ่ม {scope}” ด้านล่าง
                  </td>
                </tr>
              ) : null}

              {groups.map((group) => {
                const gHub = group.hub;
                const draftingThisHub = draftInHubId != null && gHub?.hub_id === draftInHubId;
                const canAddMore = gHub ? availableCatsInHub(gHub).length > 0 : false;
                const rowSpan = group.cats.length + (draftingThisHub ? 1 : 0);

                return (
                  <React.Fragment key={gHub?.hub_id ?? 'other'}>
                    {group.cats.map((cat, idx) => {
                      const subs = byCategory.get(cat.id) ?? [];
                      const hasSubError = !isMT && pdCatsWithNoSubs.has(cat.id);
                      return (
                        <tr key={cat.id} className={cn(hasSubError && 'bg-red-50/40', 'hover:bg-slate-50/50')}>
                          {idx === 0 ? (
                            <td className={cn(tdClass, 'bg-slate-50/40 align-top')} rowSpan={rowSpan}>
                              {hubBadge(gHub?.name ?? 'หมวดอื่นๆ')}
                              {editable && gHub && canAddMore && !draftingThisHub ? (
                                <div className='mt-2'>
                                  <Button
                                    type='button'
                                    variant='unstyled'
                                    onClick={() => startAddInHub(scope, gHub.hub_id)}
                                    className={cn(
                                      'inline-flex items-center gap-1 text-[11px] font-semibold',
                                      isMT ? 'text-emerald-700 hover:underline' : 'text-indigo-700 hover:underline',
                                    )}
                                  >
                                    <Plus size={11} /> เพิ่มหมวด
                                  </Button>
                                </div>
                              ) : null}
                            </td>
                          ) : null}
                          <td className={cn(tdClass, 'font-semibold text-slate-900')}>{cat.name}</td>
                          {!isMT ? <td className={tdClass}>{subCell(cat.id, subs, hasSubError)}</td> : null}
                          {editable ? (
                            <td className={cn(tdClass, 'text-center')}>
                              <Button
                                type='button'
                                variant='unstyled'
                                onClick={() => removeCategoryFromForm(cat.id)}
                                className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'
                                aria-label={`ลบ ${cat.name}`}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}

                    {/* แถวร่าง: เพิ่มหมวดใน hub นี้ (hub ล็อก ไม่มี hub cell — rowSpan ครอบแล้ว) */}
                    {editable && draftingThisHub ? (
                      <DraftRowEditor
                        scope={scope}
                        draft={draft!}
                        setDraft={setDraft}
                        hubsForScope={hubsForScope(scope)}
                        availableCatsInHub={availableCatsInHub}
                        draftHub={draftHub}
                        draftCatSubs={draftCatSubs}
                        draftValid={!!draftValid}
                        subsLoading={subsLoading}
                        onCommit={commitAdd}
                        onCancel={cancelAdd}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}

              {/* แถวร่าง: เพิ่ม Hub ใหม่ (มี hub select) */}
              {editable && bottomDrafting ? (
                <DraftRowEditor
                  scope={scope}
                  draft={draft!}
                  setDraft={setDraft}
                  hubsForScope={hubsForScope(scope)}
                  availableCatsInHub={availableCatsInHub}
                  draftHub={draftHub}
                  draftCatSubs={draftCatSubs}
                  draftValid={!!draftValid}
                  subsLoading={subsLoading}
                  onCommit={commitAdd}
                  onCancel={cancelAdd}
                  showHubSelect
                />
              ) : null}

              {/* ปุ่มเพิ่ม Hub ใหม่ */}
              {editable && !isDrafting ? (
                <tr>
                  <td colSpan={colCount} className='px-3 py-2'>
                    <Button
                      type='button'
                      variant='unstyled'
                      onClick={() => startAdd(scope)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-[12px] font-semibold transition-colors',
                        isMT
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
                      )}
                    >
                      <Plus size={13} /> เพิ่ม {scope} (Hub ใหม่)
                    </Button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      {renderScope('หมวดสินค้า / รับผลิต (PD)', 'PD')}
      {renderScope('หมวดวัตถุดิบ (MT)', 'MT')}

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
    </div>
  );
}

// ── Draft add-row editor ───────────────────────────────────────────────────────
function DraftRowEditor({
  scope,
  draft,
  setDraft,
  hubsForScope,
  availableCatsInHub,
  draftHub,
  draftCatSubs,
  draftValid,
  subsLoading,
  onCommit,
  onCancel,
  showHubSelect = false,
}: {
  scope: Scope;
  draft: DraftRow;
  setDraft: (d: DraftRow) => void;
  hubsForScope: IHubResponse[];
  availableCatsInHub: (hub: IHubResponse) => { category_id: number; name: string }[];
  draftHub: IHubResponse | null;
  draftCatSubs: SubCategoryOption[];
  draftValid: boolean;
  subsLoading: boolean;
  onCommit: () => void;
  onCancel: () => void;
  /** true = แถวเพิ่ม Hub ใหม่ (โชว์ dropdown เลือก hub); false = เพิ่มใน hub ที่ล็อกไว้ (rowSpan ครอบ) */
  showHubSelect?: boolean;
}) {
  const isMT = scope === 'MT';
  const availableHubs = hubsForScope.filter((h) => availableCatsInHub(h).length > 0);
  const cats = draftHub ? availableCatsInHub(draftHub) : [];
  const selectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 ' +
    (isMT ? 'focus:border-emerald-400 focus:ring-emerald-300' : 'focus:border-indigo-400 focus:ring-indigo-300');

  return (
    <>
      <tr className={isMT ? 'bg-emerald-50/40' : 'bg-indigo-50/40'}>
        {showHubSelect ? (
          <td className='border-b border-slate-100 px-3 py-2 align-top'>
            <select
              value={draftHub?.hub_id ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setDraft({ ...draft, hubId: Number.isFinite(id) ? id : null, categoryId: null, subIds: [] });
              }}
              className={selectClass}
            >
              {availableHubs.length === 0 ? <option value=''>ไม่มี Hub ให้เพิ่ม</option> : null}
              {availableHubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  {h.name}
                </option>
              ))}
            </select>
          </td>
        ) : null}
        <td className='border-b border-slate-100 px-3 py-2 align-top'>
          <select
            value={draft.categoryId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setDraft({ ...draft, categoryId: Number.isFinite(id) && id > 0 ? id : null, subIds: [] });
            }}
            className={selectClass}
            disabled={!draftHub}
          >
            <option value=''>— เลือกหมวดหลัก —</option>
            {cats.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        {!isMT ? (
          <td className='border-b border-slate-100 px-3 py-2 align-top'>
            {draft.categoryId == null ? (
              <span className='text-[11px] text-slate-400'>เลือกหมวดหลักก่อน</span>
            ) : (
              <SubCategoryCellPicker
                subs={draftCatSubs}
                selectedIds={draft.subIds}
                onChange={(next) => setDraft({ ...draft, subIds: next })}
                isLoading={subsLoading}
                invalid={draftCatSubs.length > 0 && draft.subIds.length === 0}
              />
            )}
          </td>
        ) : null}
        <td className='border-b border-slate-100 px-3 py-2 text-center align-top'>
          <div className='inline-flex items-center gap-1'>
            <Button
              type='button'
              variant='unstyled'
              onClick={onCommit}
              disabled={!draftValid}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40',
                isMT ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700',
              )}
            >
              <Check size={12} /> เพิ่ม
            </Button>
            <Button
              type='button'
              variant='unstyled'
              onClick={onCancel}
              className='rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-white'
              aria-label='ยกเลิก'
            >
              <X size={13} />
            </Button>
          </div>
        </td>
      </tr>
    </>
  );
}

// ── หมวดย่อยในเซลล์เดียว (popover multi-select เหมือน dropdown category) ─────────
function SubCategoryCellPicker({
  subs,
  selectedIds,
  onChange,
  isLoading,
  invalid,
}: {
  subs: SubCategoryOption[];
  selectedIds: number[];
  onChange: (next: number[]) => void;
  isLoading?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const names = selectedSubNames(selectedIds, subs);

  if (subs.length === 0) {
    return <span className='text-[11px] text-gray-400'>ไม่มีหมวดย่อย</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'flex min-h-8 w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
            invalid
              ? 'border-red-300 bg-red-50/40 hover:border-red-400'
              : 'border-slate-200 bg-white hover:border-indigo-300',
          )}
        >
          {names.length > 0 ? (
            <span className='flex flex-wrap gap-1'>
              {names.map((n) => (
                <span
                  key={n}
                  className='inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600'
                >
                  {n}
                </span>
              ))}
            </span>
          ) : (
            <span className='text-[11px] font-medium text-red-500'>เลือกหมวดย่อย</span>
          )}
          <ChevronDown size={13} className='shrink-0 text-slate-400' />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[280px] rounded-lg p-0'>
        <SubCategoryPickerField
          subs={subs}
          selectedIds={selectedIds}
          onChange={onChange}
          isLoading={isLoading}
          className='rounded-lg border-0'
        />
      </PopoverContent>
    </Popover>
  );
}

// ── หมวดย่อยแบบอ่านอย่างเดียว (preview mode) ────────────────────────────────────
function ReadonlySubNames({ names, hasSubs }: { names: string[]; hasSubs: boolean }) {
  if (names.length > 0) {
    return (
      <div className='flex flex-wrap gap-1.5'>
        {names.map((name) => (
          <span
            key={name}
            className='inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600'
          >
            {name}
          </span>
        ))}
      </div>
    );
  }
  return hasSubs ? (
    <span className='text-[11px] font-medium text-red-500'>ยังไม่ได้เลือก</span>
  ) : (
    <span className='text-[11px] text-gray-400'>—</span>
  );
}
