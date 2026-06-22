import React, { useMemo, useState } from 'react';
import { Search, Hash, Weight, Droplets, Ruler, Grid3X3, Package, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ── types ─────────────────────────────────────────────────────────── */
export type UnitOption = {
  unit_id: number;
  name_th: string;
  name_en: string;
  code: string;
  group_th: string;
  group_en: string;
};

type UnitGroup = {
  key: string;
  label_th: string;
  label_en: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};

/* WMS / Logistics category mapping */
const GROUP_META: UnitGroup[] = [
  { key: 'นับจำนวน', label_th: 'นับจำนวน', label_en: 'Counting', icon: Hash,     color: '#6366f1', bg: '#eef2ff' },
  { key: 'น้ำหนัก',   label_th: 'น้ำหนัก',   label_en: 'Weight',   icon: Weight,   color: '#f59e0b', bg: '#fffbeb' },
  { key: 'ปริมาตร',  label_th: 'ปริมาตร',  label_en: 'Volume',   icon: Droplets, color: '#06b6d4', bg: '#ecfeff' },
  { key: 'ความยาว',  label_th: 'ความยาว',  label_en: 'Length',   icon: Ruler,    color: '#10b981', bg: '#ecfdf5' },
  { key: 'พื้นที่',     label_th: 'พื้นที่',     label_en: 'Area',     icon: Grid3X3,  color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'บรรจุภัณฑ์', label_th: 'บรรจุภัณฑ์', label_en: 'Packaging', icon: Package,  color: '#ef4444', bg: '#fef2f2' },
];

function getGroupMeta(group_th: string): UnitGroup {
  return GROUP_META.find((g) => g.key === group_th) ?? {
    key: group_th,
    label_th: group_th,
    label_en: 'Other',
    icon: Hash,
    color: '#6b7280',
    bg: '#f9fafb',
  };
}

/* ── picker trigger ────────────────────────────────────────────────── */
type Props = {
  units: UnitOption[];
  value: number | undefined;
  onChange: (unitId: number | undefined) => void;
  triggerClassName?: string;
};

export function UnitPicker({ units, value, onChange, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selected = units.find((u) => u.unit_id === value);
  const triggerLabel = selected ? `${selected.name_th} (${selected.code})` : 'ชิ้น';

  // group units
  const groups = useMemo(() => {
    const map = new Map<string, UnitOption[]>();
    for (const u of units) {
      if (!map.has(u.group_th)) map.set(u.group_th, []);
      map.get(u.group_th)!.push(u);
    }
    return GROUP_META.filter((g) => map.has(g.key)).map((g) => ({
      ...g,
      items: map.get(g.key)!,
    }));
  }, [units]);

  // filter by active group + search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = activeGroup
      ? groups.find((g) => g.key === activeGroup)?.items ?? []
      : units;
    if (q) {
      items = items.filter(
        (u) =>
          u.name_th.toLowerCase().includes(q) ||
          u.name_en.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q),
      );
    }
    return items;
  }, [units, groups, activeGroup, search]);

  const handleSelect = (u: UnitOption | null) => {
    onChange(u?.unit_id);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* trigger button */}
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-[130px] shrink-0 items-center justify-between gap-1 text-left transition-colors',
          triggerClassName ??
            'rounded-xl border border-gray-200 bg-[var(--neutral-warm-surface)]/50 px-3 py-2 text-sm font-medium text-brand-navy-deep hover:border-gray-300 xl:text-[15px]',
        )}
      >
        <span className='truncate'>{triggerLabel}</span>
        <ChevronDown size={14} className='shrink-0 text-gray-400' />
      </Button>

      {/* bottom-sheet picker */}
      <AppSheetDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSearch('');
        }}
        title='เลือกหน่วยนับ'
        titleClassName='text-base font-bold text-brand-navy-deep xl:text-lg'
        bodyClassName='p-0'
        footer={
          <div className='flex gap-2 w-full'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => handleSelect(null)}
              className='flex-1 py-2.5 rounded-xl border border-brand-violet-soft bg-white text-sm font-semibold text-brand-violet-deep transition-colors hover:bg-brand-lavender-chip/50 xl:text-[15px]'
            >
              ใช้ค่าเริ่มต้น (ชิ้น)
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setOpen(false)}
              className='flex-1 py-2.5 rounded-xl bg-brand-violet-deep text-sm font-semibold text-white transition-colors hover:bg-brand-purple xl:text-[15px]'
            >
              ยืนยัน
            </Button>
          </div>
        }
      >
        {/* search */}
        <div className='sticky top-0 z-10 bg-white px-4 pt-3 pb-2'>
          <div className='relative'>
            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
            <Input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='ค้นหาหน่วย เช่น kg, ลิตร, กล่อง...'
              className='pl-9 pr-8 py-2.5 rounded-xl border-gray-200 text-sm bg-gray-50 focus:bg-white xl:text-[15px] xl:placeholder:text-[13px]'
            />
            {search && (
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSearch('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600'
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* category tabs */}
        <div className='px-4 border-b border-gray-200'>
          <div className='flex overflow-x-auto no-scrollbar -mb-px'>
            <button
              type='button'
              onClick={() => setActiveGroup(null)}
              className={`shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors xl:text-[13px] ${
                activeGroup === null
                  ? 'border-brand-violet-deep text-brand-violet-deep'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              ทั้งหมด
            </button>
            {groups.map((g) => {
              const Icon = g.icon;
              const isActive = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  type='button'
                  onClick={() => setActiveGroup(g.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors xl:text-[13px] ${
                    isActive
                      ? 'border-brand-violet-deep text-brand-violet-deep'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={13} style={{ color: isActive ? 'var(--brand-violet-deep)' : '#9CA3AF' }} />
                  {g.label_th}
                </button>
              );
            })}
          </div>
        </div>

        {/* unit grid */}
        <div className='px-4 pt-3 pb-4 max-h-[50vh] overflow-y-auto'>
          {/* if showing all, render grouped */}
          {activeGroup === null && !search ? (
            <div className='space-y-4'>
              {groups.map((g) => {
                const Icon = g.icon;
                return (
                  <div key={g.key}>
                    <div className='flex items-center gap-2 mb-2'>
                      <div
                        className='w-6 h-6 rounded-md flex items-center justify-center'
                        style={{ backgroundColor: g.bg }}
                      >
                        <Icon size={13} style={{ color: g.color }} />
                      </div>
                      <span className='text-xs font-bold text-gray-700 xl:text-sm'>{g.label_th}</span>
                      <span className='text-[10px] text-gray-400 xl:text-[12px]'>{g.label_en}</span>
                    </div>
                    <div className='grid grid-cols-3 gap-2'>
                      {g.items.map((u) => {
                        const isSelected = value === u.unit_id;
                        return (
                          <button
                            key={u.unit_id}
                            type='button'
                            onClick={() => handleSelect(u)}
                            className={`relative flex flex-col items-center gap-0.5 p-3 rounded-xl border text-center transition-all active:scale-[0.97] ${
                              isSelected
                                ? 'border-brand-violet-deep bg-brand-violet-soft ring-2 ring-brand-purple/15'
                                : 'border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {isSelected && (
                              <div className='absolute top-1.5 right-1.5'>
                                <Check size={12} className='text-brand-violet-deep' />
                              </div>
                            )}
                            <span className='text-sm font-bold text-gray-800 xl:text-[15px]'>{u.name_th}</span>
                            <span className='text-[10px] text-gray-400 leading-tight xl:text-[12px]'>
                              {u.name_en}
                            </span>
                            <span
                              className='mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold xl:text-[11px]'
                              style={{ backgroundColor: g.bg, color: g.color }}
                            >
                              {u.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8'>
              <Search size={28} className='text-gray-200' />
              <p className='text-xs text-gray-400 xl:text-sm'>
                {search ? `ไม่พบหน่วย "${search}"` : 'ไม่มีรายการ'}
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-3 gap-2'>
              {filtered.map((u) => {
                const isSelected = value === u.unit_id;
                const meta = getGroupMeta(u.group_th);
                return (
                  <button
                    key={u.unit_id}
                    type='button'
                    onClick={() => handleSelect(u)}
                    className={`relative flex flex-col items-center gap-0.5 p-3 rounded-xl border text-center transition-all active:scale-[0.97] ${
                      isSelected
                        ? 'border-brand-violet-deep bg-brand-violet-soft ring-2 ring-brand-purple/15'
                        : 'border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && (
                      <div className='absolute top-1.5 right-1.5'>
                        <Check size={12} className='text-brand-violet-deep' />
                      </div>
                    )}
                    <span className='text-sm font-bold text-gray-800 xl:text-[15px]'>{u.name_th}</span>
                    <span className='text-[10px] text-gray-400 leading-tight xl:text-[12px]'>{u.name_en}</span>
                    <span
                      className='mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold xl:text-[11px]'
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {u.code}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </AppSheetDialog>
    </>
  );
}
