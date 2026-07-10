import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@lib/utils';
import type { SubCategoryOption } from '@/components/factory/profile/subCategoryPicker.utils';
import {
  partitionSubs,
  subsForDisplay,
  toggleSubCategory,
} from '@/components/factory/profile/subCategoryPicker.utils';

interface Props {
  subs: SubCategoryOption[];
  selectedIds: number[];
  onChange: (next: number[]) => void;
  isLoading?: boolean;
  className?: string;
}

export function SubCategoryPickerField({
  subs,
  selectedIds,
  onChange,
  isLoading = false,
  className,
}: Props) {
  const [search, setSearch] = useState('');
  const { allItem, regular } = partitionSubs(subs);
  const displayIds = subsForDisplay(selectedIds, subs);
  const allSelected = allItem ? displayIds.includes(allItem.id) : false;
  const selectedCount = subs.filter((s) => displayIds.includes(s.id)).length;

  const filteredRegular = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return regular;
    return regular.filter((s) => s.name.toLowerCase().includes(q));
  }, [regular, search]);

  // รีเซ็ตคำค้นเมื่อเปลี่ยนชุดหมวดย่อย (สลับหมวด)
  const subsKey = subs.map((s) => s.id).join(',');
  useEffect(() => {
    setSearch('');
  }, [subsKey]);

  // ทำความสะอาด state เมื่อโหลดแล้วพบว่าเลือก "ทั้งหมด" ค้างอยู่พร้อมตัวอื่น
  useEffect(() => {
    if (!allItem || !selectedIds.includes(allItem.id)) return;
    const catSubIds = new Set(subs.map((s) => s.id));
    const hasExtra = selectedIds.some((id) => catSubIds.has(id) && id !== allItem.id);
    if (!hasExtra) return;
    onChange([
      ...selectedIds.filter((x) => !catSubIds.has(x)),
      allItem.id,
    ].sort((a, b) => a - b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItem?.id, subsKey]);

  if (isLoading && subs.length === 0) {
    return <p className='text-xs text-gray-400'>กำลังโหลดหมวดย่อย…</p>;
  }

  if (subs.length === 0) {
    return <p className='text-xs text-gray-400'>ไม่มีหมวดย่อย</p>;
  }

  const handleToggle = (id: number) => {
    onChange(toggleSubCategory(selectedIds, subs, id));
  };

  const showSearch = regular.length > 5;
  const q = search.trim();
  const allItemVisible =
    !q || (allItem != null && allItem.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <div className='flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2'>
        <p className='text-[11px] font-semibold text-slate-600'>เลือกหมวดย่อย</p>
        <span className='rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200'>
          {selectedCount}/{subs.length}
        </span>
      </div>

      {showSearch ? (
        <div className='border-b border-slate-100 px-3 py-2'>
          <div className='relative'>
            <Search
              size={13}
              className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400'
            />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='ค้นหาหมวดย่อย…'
              className='w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-mauve focus:outline-none focus:ring-1 focus:ring-brand-mauve'
            />
          </div>
        </div>
      ) : null}

      {allItem && allItemVisible ? (
        <div className='border-b border-slate-100 px-3 py-2'>
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
              displayIds.includes(allItem.id)
                ? 'border-violet-400 bg-violet-50'
                : 'border-violet-200 bg-violet-50/40 hover:bg-violet-50',
            )}
          >
            <input
              type='checkbox'
              className='h-4 w-4 rounded border-slate-300 text-brand-purple focus:ring-brand-mauve'
              checked={displayIds.includes(allItem.id)}
              onChange={() => handleToggle(allItem.id)}
            />
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-semibold text-violet-800'>{allItem.name}</p>
              <p className='text-[10px] text-violet-600'>รองรับทุกหมวดย่อยในหมวดนี้</p>
            </div>
            <span className='shrink-0 rounded bg-violet-200 px-1.5 py-0.5 text-[9px] font-bold text-violet-700'>
              ทั้งหมด
            </span>
          </label>
          {allSelected ? (
            <p className='mt-1.5 text-[10px] text-violet-600'>
              เลือก &quot;ทั้งหมด&quot; แล้ว — ไม่สามารถเลือกหมวดย่อยอื่นเพิ่มได้
            </p>
          ) : null}
        </div>
      ) : null}

      {regular.length > 0 ? (
        <div className='max-h-44 overflow-y-auto'>
          {filteredRegular.length === 0 ? (
            <p className='px-3 py-4 text-center text-[11px] text-slate-400'>ไม่พบหมวดย่อย</p>
          ) : (
            <table className='w-full border-collapse text-xs'>
              <thead className='sticky top-0 z-[1] bg-slate-50'>
                <tr>
                  <th className='w-10 border-b border-slate-200 px-2 py-1.5 text-center text-[10px] font-semibold text-slate-500'>
                    ลำดับ
                  </th>
                  <th className='border-b border-slate-200 px-2 py-1.5 text-left text-[10px] font-semibold text-slate-500'>
                    หมวดย่อย
                  </th>
                  <th className='w-12 border-b border-slate-200 px-2 py-1.5 text-center text-[10px] font-semibold text-slate-500'>
                    เลือก
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRegular.map((sub) => {
                  const sel = displayIds.includes(sub.id);
                  const disabled = allSelected;
                  const order = Number.isFinite(Number(sub.sortOrder)) ? Number(sub.sortOrder) : 0;

                  return (
                    <tr
                      key={sub.id}
                      className={cn(
                        sel && !disabled && 'bg-brand-purple/5',
                        disabled && 'bg-slate-50/80 opacity-50',
                      )}
                    >
                      <td className='border-b border-slate-100 px-2 py-2 text-center text-[10px] tabular-nums text-slate-400'>
                        {order > 0 && order < 99 ? order : '—'}
                      </td>
                      <td className='border-b border-slate-100 px-2 py-2 font-medium text-slate-700'>
                        {sub.name}
                      </td>
                      <td className='border-b border-slate-100 px-2 py-2 text-center'>
                        <input
                          type='checkbox'
                          className='h-4 w-4 rounded border-slate-300 text-brand-purple focus:ring-brand-mauve disabled:cursor-not-allowed'
                          checked={sel}
                          disabled={disabled}
                          onChange={() => handleToggle(sub.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
