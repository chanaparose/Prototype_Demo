import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@lib/utils';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import type { IHubResponse } from '@/services/api/types/master.types';
import {
  useSubCategoriesByCategories,
  type SubCategoryOption,
} from '@/hooks/master/useSubCategoriesByCategory';
import {
  selectedSubNames as formatSelectedSubNames,
  subsForDisplay,
} from '@/components/factory/profile/subCategoryPicker.utils';
import { SubCategoryPickerField } from '@/components/factory/profile/SubCategoryPickerField';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { parseCategorySelection } from '@/domain/factory/schemas/categoryPicker.schema';

type Mode = 'manage' | 'pick-hub' | 'pick-categories';
type ScopeTab = 'PD' | 'MT';

interface Props {
  open: boolean;
  initialCategoryIds: number[];
  initialSubCategoryIds: number[];
  focusCategoryId?: number | null;
  onClose: () => void;
  onConfirm: (categoryIds: number[], subCategoryIds: number[]) => void;
}

function hubSelectedCount(hub: IHubResponse, categoryIds: number[]) {
  return hub.categories.filter((c) => categoryIds.includes(c.category_id)).length;
}

export function CategoryManageModal({
  open,
  initialCategoryIds,
  initialSubCategoryIds,
  focusCategoryId = null,
  onClose,
  onConfirm,
}: Props) {
  const { data: hubs = [], isLoading, isError } = useLbiHubsQuery();
  const [mode, setMode] = useState<Mode>('manage');
  const [scopeTab, setScopeTab] = useState<ScopeTab>('PD');
  const [search, setSearch] = useState('');
  const [targetHubId, setTargetHubId] = useState<number | null>(null);
  const [categoryIds, setCategoryIds] = useState<number[]>(initialCategoryIds);
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>(initialSubCategoryIds);
  const [confirmError, setConfirmError] = useState('');
  const [expandedEditCatId, setExpandedEditCatId] = useState<number | null>(null);
  const focusRef = useRef<HTMLTableRowElement | null>(null);

  const mtCategoryIds = useMemo(() => {
    const ids = new Set<number>();
    for (const h of hubs) {
      if (h.scope !== 'MT') continue;
      for (const c of h.categories) ids.add(c.category_id);
    }
    return ids;
  }, [hubs]);

  const pdSelectedIds = useMemo(
    () => categoryIds.filter((id) => !mtCategoryIds.has(id)),
    [categoryIds, mtCategoryIds],
  );

  // โหลดหมวดย่อยของหมวดที่เลือก + หมวดใน Hub ที่กำลังเลือก (เพื่อค้นหาชื่อหมวดย่อยได้)
  const subFetchIds = useMemo(() => {
    const ids = new Set(pdSelectedIds);
    if (mode === 'pick-categories' && targetHubId != null) {
      const hub = hubs.find((h) => h.hub_id === targetHubId);
      if (hub && hub.scope !== 'MT') {
        for (const c of hub.categories) ids.add(c.category_id);
      }
    }
    return [...ids].sort((a, b) => a - b);
  }, [pdSelectedIds, mode, targetHubId, hubs]);

  const { byCategory, isLoading: subsLoading } = useSubCategoriesByCategories(subFetchIds);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const h of hubs) {
      for (const c of h.categories) map.set(c.category_id, c.name);
    }
    return map;
  }, [hubs]);

  const activeHubs = useMemo(
    () =>
      hubs
        .filter((h) => hubSelectedCount(h, categoryIds) > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [hubs, categoryIds],
  );

  const availableHubs = useMemo(
    () =>
      hubs
        .filter((h) => hubSelectedCount(h, categoryIds) === 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [hubs, categoryIds],
  );

  const targetHub = useMemo(
    () => (targetHubId != null ? (hubs.find((h) => h.hub_id === targetHubId) ?? null) : null),
    [hubs, targetHubId],
  );

  useEffect(() => {
    if (!open) return;
    setCategoryIds(initialCategoryIds);
    setSubCategoryIds(initialSubCategoryIds);
    setSearch('');
    setConfirmError('');
    setTargetHubId(null);
    setExpandedEditCatId(focusCategoryId);

    if (focusCategoryId != null) {
      const hub = hubs.find((h) => h.categories.some((c) => c.category_id === focusCategoryId));
      if (hub) setTargetHubId(hub.hub_id);
      setMode('manage');
    } else if (initialCategoryIds.length === 0) {
      setMode('pick-hub');
      setScopeTab('PD');
    } else {
      setMode('manage');
    }
  }, [open, initialCategoryIds, initialSubCategoryIds, focusCategoryId, hubs]);

  useEffect(() => {
    if (!open || focusCategoryId == null || mode !== 'manage') return;
    const t = window.setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, focusCategoryId, mode, activeHubs.length]);

  const removeCategory = (id: number) => {
    const subs = byCategory.get(id) ?? [];
    const subIds = subs.map((s) => s.id);
    setCategoryIds((prev) => prev.filter((x) => x !== id));
    setSubCategoryIds((prev) => prev.filter((x) => !subIds.includes(x)));
    setConfirmError('');
  };

  const toggleCategory = (id: number, isMT: boolean) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        const subs = byCategory.get(id) ?? [];
        const subIds = subs.map((s) => s.id);
        setSubCategoryIds((subsPrev) => subsPrev.filter((x) => !subIds.includes(x)));
        return prev.filter((x) => x !== id);
      }
      return [...prev, id].sort((a, b) => a - b);
    });
    setConfirmError('');
    if (!isMT && !categoryIds.includes(id)) {
      // newly selected PD category — subs section appears below
    }
  };

  const removeHub = (hub: IHubResponse) => {
    const hubCatIds = new Set(hub.categories.map((c) => c.category_id));
    const toRemove = categoryIds.filter((id) => hubCatIds.has(id));
    const subIdsToRemove = new Set<number>();
    for (const cid of toRemove) {
      for (const s of byCategory.get(cid) ?? []) subIdsToRemove.add(s.id);
    }
    setCategoryIds((prev) => prev.filter((id) => !hubCatIds.has(id)));
    setSubCategoryIds((prev) => prev.filter((id) => !subIdsToRemove.has(id)));
    setConfirmError('');
  };

  const handleConfirm = () => {
    const parsed = parseCategorySelection(categoryIds);
    if (!parsed.success) {
      setConfirmError(parsed.error.issues[0]?.message ?? 'เลือกอย่างน้อย 1 หมวดหมู่');
      return;
    }

    for (const cid of pdSelectedIds) {
      const subs = byCategory.get(cid) ?? [];
      if (subs.length === 0) continue;
      const displaySubs = subsForDisplay(subCategoryIds, subs);
      const hasSub = subs.some((s) => displaySubs.includes(s.id));
      if (!hasSub) {
        const name = categoryNameById.get(cid) ?? 'หมวดนี้';
        setConfirmError(`กรุณาเลือกหมวดย่อยสำหรับ "${name}"`);
        return;
      }
    }

    onConfirm(categoryIds, subCategoryIds);
  };

  const goPickHub = () => {
    setSearch('');
    setScopeTab(availableHubs.some((h) => h.scope === 'PD') ? 'PD' : 'MT');
    setMode('pick-hub');
  };

  const goPickCategories = (hubId: number) => {
    setTargetHubId(hubId);
    setSearch('');
    setMode('pick-categories');
  };

  const goManage = () => {
    setTargetHubId(null);
    setSearch('');
    setConfirmError('');
    setExpandedEditCatId(null);
    setMode('manage');
  };

  const matchesQuery = (q: string, ...texts: string[]) => {
    if (!q) return true;
    return texts.some((t) => t.toLowerCase().includes(q));
  };

  const categoryMatchesSearch = (categoryId: number, categoryName: string, q: string) => {
    if (!q) return true;
    if (categoryName.toLowerCase().includes(q)) return true;
    const subs = byCategory.get(categoryId) ?? [];
    return subs.some((s) => s.name.toLowerCase().includes(q));
  };

  const filteredAvailableHubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableHubs
      .filter((h) => h.scope === scopeTab)
      .filter((h) => {
        if (!q) return true;
        if (h.name.toLowerCase().includes(q)) return true;
        return h.categories.some((c) => categoryMatchesSearch(c.category_id, c.name, q));
      });
  }, [availableHubs, scopeTab, search, byCategory]);

  const pickCategoriesList = useMemo(() => {
    if (!targetHub) return [];
    const q = search.trim().toLowerCase();
    const isExisting = hubSelectedCount(targetHub, categoryIds) > 0;
    const list = isExisting
      ? targetHub.categories.filter((c) => !categoryIds.includes(c.category_id))
      : targetHub.categories;
    if (!q) return list;
    return list.filter((c) => categoryMatchesSearch(c.category_id, c.name, q));
  }, [targetHub, categoryIds, search, byCategory]);

  const sheetRows = useMemo(() => {
    const rows: Array<{
      hub: IHubResponse;
      cat: { category_id: number; name: string };
      isFirstInHub: boolean;
      hubRowSpan: number;
      isMT: boolean;
    }> = [];
    const q = search.trim().toLowerCase();

    for (const hub of activeHubs) {
      const selectedCats = hub.categories.filter((c) => {
        if (!categoryIds.includes(c.category_id)) return false;
        if (!q) return true;
        if (matchesQuery(q, hub.name, c.name)) return true;
        return categoryMatchesSearch(c.category_id, c.name, q);
      });
      if (selectedCats.length === 0) continue;

      const isMT = hub.scope === 'MT';
      // นับแถวแก้ไขหมวดย่อยด้วย เพื่อให้ Hub rowspan ไม่ทับแผงเลือก
      const editExtra = isMT
        ? 0
        : selectedCats.filter((c) => expandedEditCatId === c.category_id).length;
      const hubRowSpan = selectedCats.length + editExtra;

      selectedCats.forEach((cat, idx) => {
        rows.push({
          hub,
          cat,
          isFirstInHub: idx === 0,
          hubRowSpan,
          isMT,
        });
      });
    }
    return rows;
  }, [activeHubs, categoryIds, expandedEditCatId, search, byCategory]);

  const thClass =
    'border border-gray-300 bg-gray-100 px-2.5 py-2 text-left text-[11px] font-semibold text-gray-600 whitespace-nowrap';
  const tdClass = 'border border-gray-200 px-2.5 py-2 text-xs text-gray-800 align-top';
  const renderSubPicker = (subs: SubCategoryOption[]) => (
    <SubCategoryPickerField
      subs={subs}
      selectedIds={subCategoryIds}
      onChange={setSubCategoryIds}
      isLoading={subsLoading}
    />
  );

  const title =
    mode === 'manage'
      ? 'จัดการหมวดหมู่'
      : mode === 'pick-hub'
        ? 'เพิ่ม Hub'
        : `เลือกหมวดใน "${targetHub?.name ?? ''}"`;

  const renderManageTable = (title: string, scope: ScopeTab) => {
    const isMTScope = scope === 'MT';
    const rows = sheetRows.filter((row) => row.hub.scope === scope);
    const rowCount = rows.length;

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
            <table className='w-full min-w-[520px] border-collapse bg-white'>
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
                {rows.map(({ hub, cat, isFirstInHub, hubRowSpan, isMT }) => {
                  const subs = byCategory.get(cat.category_id) ?? [];
                  const names = formatSelectedSubNames(subCategoryIds, subs);
                  const isFocus = focusCategoryId === cat.category_id;
                  const isEditing = expandedEditCatId === cat.category_id;
                  const hasSubError = !isMT && subs.length > 0 && names.length === 0;

                  return (
                    <Fragment key={cat.category_id}>
                      <tr
                        ref={isFocus ? focusRef : undefined}
                        className={cn(
                          isFocus && 'bg-brand-purple/5',
                          isEditing && 'bg-sky-50/60',
                          hasSubError && 'bg-red-50/50',
                        )}
                      >
                        {isFirstInHub ? (
                          <td className={cn(tdClass, 'font-medium')} rowSpan={hubRowSpan}>
                            <div className='flex items-start justify-between gap-1'>
                              <span
                                className={cn(
                                  'font-semibold',
                                  isMT ? 'text-emerald-700' : 'text-brand-purple',
                                )}
                              >
                                {hub.name}
                              </span>
                              <Button
                                type='button'
                                variant='unstyled'
                                onClick={() => removeHub(hub)}
                                className='shrink-0 rounded p-0.5 text-gray-400 hover:text-red-600'
                                aria-label={`ลบ Hub ${hub.name}`}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                            {hub.categories.some((c) => !categoryIds.includes(c.category_id)) ? (
                              <Button
                                type='button'
                                variant='unstyled'
                                onClick={() => goPickCategories(hub.hub_id)}
                                className='mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-purple hover:underline'
                              >
                                <Plus size={10} /> เพิ่มหมวด
                              </Button>
                            ) : null}
                          </td>
                        ) : null}
                        <td className={cn(tdClass, 'font-medium')}>{cat.name}</td>
                        {!isMTScope ? (
                          <td className={tdClass}>
                            {names.length > 0 ? (
                              <span className='text-[11px] leading-relaxed text-gray-700'>
                                {names.join(', ')}
                              </span>
                            ) : subs.length > 0 ? (
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
                            {!isMT && subs.length > 0 ? (
                              <Button
                                type='button'
                                variant='unstyled'
                                onClick={() =>
                                  setExpandedEditCatId((prev) =>
                                    prev === cat.category_id ? null : cat.category_id,
                                  )
                                }
                                className={cn(
                                  'rounded p-1 hover:bg-gray-100',
                                  isEditing ? 'text-brand-purple' : 'text-gray-500',
                                )}
                                aria-label={`แก้ไขหมวดย่อย ${cat.name}`}
                              >
                                <Pencil size={13} />
                              </Button>
                            ) : null}
                            <Button
                              type='button'
                              variant='unstyled'
                              onClick={() => removeCategory(cat.category_id)}
                              className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'
                              aria-label={`ลบ ${cat.name}`}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && !isMT ? (
                        <tr className='bg-sky-50/40'>
                          {/* ไม่รวมคอลัมน์ Hub — ให้ rowspan ของ Hub ครอบแถวนี้แทน */}
                          <td colSpan={3} className='border border-gray-200 px-3 py-2.5'>
                            <p className='mb-2 text-[11px] font-medium text-gray-600'>
                              เลือกหมวดย่อย — {cat.name}
                            </p>
                            {renderSubPicker(subs)}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='px-3 py-5 text-sm text-slate-400'>
            {search.trim() ? 'ไม่พบหมวดใน scope นี้' : 'ยังไม่ได้เลือกหมวดใน scope นี้'}
          </div>
        )}
      </div>
    );
  };

  const renderManageView = () => (
    <div className='space-y-3'>
      {activeHubs.length > 0 ? (
        <div className='relative'>
          <Search
            size={14}
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          />
          <input
            type='search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='ค้นหาหมวดหมู่ หรือหมวดย่อย…'
            className='w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-mauve focus:outline-none focus:ring-1 focus:ring-brand-mauve'
          />
        </div>
      ) : null}

      {activeHubs.length === 0 ? (
        <div className='rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center'>
          <p className='text-sm text-gray-600'>ยังไม่มี Hub ในรายการ</p>
          <p className='mt-1 text-xs text-gray-400'>กดปุ่มด้านล่างเพื่อเพิ่ม Hub แรก</p>
        </div>
      ) : sheetRows.length === 0 && search.trim() ? (
        <div className='rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center'>
          <p className='text-sm text-gray-500'>ไม่พบหมวดที่ตรงกับ &quot;{search.trim()}&quot;</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {renderManageTable('หมวดสินค้า / รับผลิต (PD)', 'PD')}
          {renderManageTable('หมวดวัตถุดิบ (MT)', 'MT')}
        </div>
      )}

      <Button
        type='button'
        variant='unstyled'
        onClick={goPickHub}
        disabled={availableHubs.length === 0}
        className='inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-mauve/50 bg-brand-purple/5 py-2.5 text-sm font-semibold text-brand-purple hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <Plus size={15} /> เพิ่ม Hub ใหม่
      </Button>
      {availableHubs.length === 0 && activeHubs.length > 0 ? (
        <p className='text-center text-[11px] text-gray-400'>เพิ่ม Hub ครบทุกรายการแล้ว</p>
      ) : null}
    </div>
  );

  const renderPickHubView = () => (
    <div className='space-y-3'>
      <div className='relative'>
        <Search
          size={14}
          className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
        />
        <input
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='ค้นหา Hub หรือหมวด…'
          className='w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-mauve focus:outline-none focus:ring-1 focus:ring-brand-mauve'
        />
      </div>

      <div className='flex gap-2'>
        {(['PD', 'MT'] as const).map((tab) => {
          const count = availableHubs.filter((h) => h.scope === tab).length;
          return (
            <button
              key={tab}
              type='button'
              onClick={() => setScopeTab(tab)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                scopeTab === tab
                  ? tab === 'PD'
                    ? 'bg-brand-purple text-white'
                    : 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {tab === 'PD' ? 'รับผลิต' : 'วัตถุดิบ'}
              {count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {filteredAvailableHubs.length === 0 ? (
        <p className='py-6 text-center text-sm text-gray-400'>
          {search.trim() ? 'ไม่พบ Hub' : 'ไม่มี Hub ที่เพิ่มได้ในแท็บนี้'}
        </p>
      ) : (
        <div className='grid gap-2 sm:grid-cols-2'>
          {filteredAvailableHubs.map((hub) => (
            <button
              key={hub.hub_id}
              type='button'
              onClick={() => goPickCategories(hub.hub_id)}
              className={cn(
                'rounded-xl border px-3 py-3 text-left transition-colors hover:border-brand-mauve hover:bg-brand-purple/5',
                hub.scope === 'MT'
                  ? 'border-emerald-100 bg-emerald-50/40'
                  : 'border-gray-200 bg-white',
              )}
            >
              <p
                className={cn(
                  'text-sm font-semibold',
                  hub.scope === 'MT' ? 'text-emerald-700' : 'text-gray-900',
                )}
              >
                {hub.name}
              </p>
              <p className='mt-0.5 text-[11px] text-gray-500'>
                {hub.categories.length} หมวดให้เลือก
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderPickCategoriesView = () => {
    if (!targetHub) return null;
    const isMT = targetHub.scope === 'MT';
    const isAddingToExisting = hubSelectedCount(targetHub, categoryIds) > 0;

    return (
      <div className='space-y-3'>
        {isAddingToExisting ? (
          <p className='text-xs text-gray-500'>เลือกหมวดเพิ่มเติมใน Hub นี้</p>
        ) : (
          <p className='text-xs text-gray-500'>
            เลือกหมวดที่ต้องการรับ{isMT ? ' (วัตถุดิบ)' : 'ผลิต'}
          </p>
        )}

        {pickCategoriesList.length > 0 || search.trim() ? (
          <div className='relative'>
            <Search
              size={14}
              className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isMT ? 'ค้นหาหมวด…' : 'ค้นหาหมวด หรือหมวดย่อย…'}
              className='w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-mauve focus:outline-none focus:ring-1 focus:ring-brand-mauve'
            />
          </div>
        ) : null}

        {pickCategoriesList.length === 0 ? (
          <p className='py-6 text-center text-sm text-gray-400'>
            {search.trim()
              ? 'ไม่พบหมวดที่ตรงกับคำค้น'
              : isAddingToExisting
                ? 'เพิ่มหมวดครบแล้วใน Hub นี้'
                : 'ไม่พบหมวด'}
          </p>
        ) : (
          <div className='max-h-[48vh] space-y-2 overflow-y-auto pr-1'>
            {pickCategoriesList.map((cat) => {
              const selected = categoryIds.includes(cat.category_id);
              const subs = byCategory.get(cat.category_id) ?? [];

              return (
                <div
                  key={cat.category_id}
                  className={cn(
                    'rounded-lg border p-2.5',
                    selected
                      ? 'border-brand-mauve/60 bg-brand-purple/5'
                      : 'border-gray-100 bg-gray-50/50',
                  )}
                >
                  <label className='flex cursor-pointer items-start gap-2'>
                    <input
                      type='checkbox'
                      className='mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-mauve'
                      checked={selected}
                      onChange={() => toggleCategory(cat.category_id, isMT)}
                    />
                    <span className='text-sm font-medium text-gray-900'>{cat.name}</span>
                  </label>

                  {selected && !isMT ? (
                    <div className='mt-2 pl-6'>{renderSubPicker(subs)}</div>
                  ) : null}
                  {selected && isMT ? (
                    <p className='mt-1.5 pl-6 text-[11px] text-emerald-600'>ไม่ต้องเลือกหมวดย่อย</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFooter = () => {
    if (mode === 'pick-hub') {
      return (
        <div className='flex w-full gap-2'>
          {activeHubs.length > 0 ? (
            <Button
              type='button'
              variant='unstyled'
              onClick={goManage}
              className='flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50'
            >
              กลับ
            </Button>
          ) : (
            <Button
              type='button'
              variant='unstyled'
              onClick={onClose}
              className='flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50'
            >
              ยกเลิก
            </Button>
          )}
        </div>
      );
    }

    if (mode === 'pick-categories') {
      const selectedInHub =
        targetHub?.categories.filter((c) => categoryIds.includes(c.category_id)).length ?? 0;

      return (
        <ModalFooter
          layout='grid-compact'
          accent='purple'
          primary={{
            label: selectedInHub > 0 ? `เสร็จ (${selectedInHub} หมวด)` : 'เสร็จ',
            onClick: goManage,
          }}
          secondary={{
            label: 'กลับ',
            onClick: () => {
              if (activeHubs.length === 0 && hubSelectedCount(targetHub!, categoryIds) === 0) {
                goPickHub();
              } else {
                goManage();
              }
            },
            tone: 'muted',
          }}
        />
      );
    }

    return (
      <ModalFooter
        layout='grid-compact'
        accent='purple'
        primary={{
          label: `บันทึก (${categoryIds.length} หมวด)`,
          loading: subsLoading,
          loadingLabel: 'กำลังโหลด…',
          onClick: handleConfirm,
        }}
        secondary={{ label: 'ยกเลิก', onClick: onClose, tone: 'muted' }}
      />
    );
  };

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      className={mode === 'manage' ? 'sm:max-w-3xl' : 'sm:max-w-xl'}
      bodyClassName='p-4 sm:p-5 space-y-4 bg-white'
      footer={renderFooter()}
    >
      {mode === 'pick-categories' ? (
        <Button
          type='button'
          variant='unstyled'
          onClick={() => {
            if (
              activeHubs.length === 0 &&
              targetHub &&
              hubSelectedCount(targetHub, categoryIds) === 0
            ) {
              goPickHub();
            } else {
              goManage();
            }
          }}
          className='inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-purple'
        >
          <ChevronLeft size={14} /> กลับ
        </Button>
      ) : null}

      {mode === 'pick-hub' && activeHubs.length > 0 ? (
        <Button
          type='button'
          variant='unstyled'
          onClick={goManage}
          className='inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-purple'
        >
          <ChevronLeft size={14} /> กลับไปรายการ Hub
        </Button>
      ) : null}

      <FormField error={confirmError || (isError ? 'โหลดไม่สำเร็จ' : undefined)}>
        {isLoading ? (
          <p className='text-sm text-gray-400'>กำลังโหลด…</p>
        ) : !isError ? (
          <>
            {mode === 'manage' && renderManageView()}
            {mode === 'pick-hub' && renderPickHubView()}
            {mode === 'pick-categories' && renderPickCategoriesView()}
          </>
        ) : null}
      </FormField>
    </AppSheetDialog>
  );
}
