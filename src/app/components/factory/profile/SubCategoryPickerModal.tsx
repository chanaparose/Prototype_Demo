import { useEffect, useState } from 'react';
import { cn } from '@lib/utils';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { parseSubCategorySelection } from '@/domain/factory/schemas/categoryPicker.schema';

interface Props {
  open: boolean;
  categoryId: number | null;
  categoryName: string;
  initialSelected: number[];
  onClose: () => void;
  onConfirm: (nextSelected: number[]) => void;
}

export function SubCategoryPickerModal({
  open,
  categoryId,
  categoryName,
  initialSelected,
  onClose,
  onConfirm,
}: Props) {
  const { byCategory, isLoading, isError } = useSubCategoriesByCategories(
    categoryId != null ? [categoryId] : [],
  );
  const subs = (categoryId != null ? (byCategory.get(categoryId) ?? []) : []).filter(
    (s) => Number.isFinite(s.id) && s.id > 0,
  );
  const [working, setWorking] = useState<number[]>(initialSelected);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    if (open) { setWorking(initialSelected); setConfirmError(''); }
  }, [open, initialSelected]);

  // หา item ที่เป็น "ทั้งหมด" (sort_order === 99) — must be before early return (hooks order)
  const allItem = subs.find((s) => Number(s.sortOrder ?? 0) === 99);
  const catSubIds = subs.map((s) => s.id);

  // Sync: once subs load, if allItem is in working, remove other catSubIds (clean up saved state)
  useEffect(() => {
    if (!open || !allItem) return;
    setWorking((prev) => {
      if (!prev.includes(allItem.id)) return prev;
      return [...prev.filter((x) => !catSubIds.includes(x)), allItem.id].sort((a, b) => a - b);
    });
  }, [open, allItem?.id, catSubIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (categoryId == null) return null;

  const toggle = (id: number) => {
    if (!Number.isFinite(id) || id <= 0) return;
    const sub = subs.find((s) => s.id === id);
    const isAll = Number(sub?.sortOrder ?? 0) === 99;
    const allSelected = allItem ? working.includes(allItem.id) : false;

    setWorking((prev) => {
      if (prev.includes(id)) {
        // uncheck
        return prev.filter((x) => x !== id);
      }
      if (isAll) {
        // เลือก "ทั้งหมด" → ลบตัวอื่นในหมวดนี้ทั้งหมด แล้วเพิ่มเฉพาะ allItem
        return [...prev.filter((x) => !catSubIds.includes(x)), id].sort((a, b) => a - b);
      }
      if (allItem && allSelected) {
        // เลือกตัวอื่นขณะ "ทั้งหมด" ถูกเลือก → ลบ allItem ออกก่อน
        return [...prev.filter((x) => x !== allItem.id), id].sort((a, b) => a - b);
      }
      return [...prev, id].sort((a, b) => a - b);
    });
    setConfirmError('');
  };

  // Derived: if allItem is selected, other items in this category are effectively deselected
  const displayWorking =
    allItem && working.includes(allItem.id)
      ? working.filter((x) => !catSubIds.includes(x) || x === allItem.id)
      : working;

  const selectedInScope = subs.filter((s) => displayWorking.includes(s.id)).length;
  const allSelected = allItem ? displayWorking.includes(allItem.id) : false;

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={(next) => { if (!next) onClose(); }}
      title='เลือกหมวดย่อย'
      className='sm:max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4 bg-white'
      footer={
        <ModalFooter
          layout='grid-compact'
          accent='purple'
          primary={{
            label: `ยืนยัน (${selectedInScope})`,
            onClick: () => {
              const inScopeIds = subs.filter((s) => displayWorking.includes(s.id)).map((s) => s.id);
              const parsed = parseSubCategorySelection(inScopeIds);
              if (!parsed.success) {
                setConfirmError(parsed.error.issues[0]?.message ?? 'เลือกอย่างน้อย 1 หมวดหมู่ย่อย');
                return;
              }
              onConfirm(displayWorking);
            },
          }}
          secondary={{ label: 'ยกเลิก', onClick: onClose, tone: 'muted' }}
        />
      }
    >
      <FormField
        helperText={`ภายใต้: ${categoryName}`}
        error={confirmError || (isError ? 'โหลดไม่สำเร็จ' : undefined)}
      >
        {isLoading ? (
          <p className='text-sm text-gray-400'>กำลังโหลด…</p>
        ) : subs.length === 0 && !isError ? (
          <p className='text-sm text-gray-400'>ไม่มีหมวดย่อยสำหรับหมวดนี้</p>
        ) : !isError ? (
          <div className='flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto'>
            {subs.map((sub) => {
              const isAll = Number(sub.sortOrder ?? 0) === 99;
              const sel = displayWorking.includes(sub.id);
              // ตัวเลือกปกติที่ถูก disable เพราะ "ทั้งหมด" ถูกเลือกอยู่
              const disabled = !isAll && allSelected;

              return (
                <label
                  key={sub.id}
                  className={cn(
                    'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                    sel
                      ? 'border-[var(--brand-purple)] bg-[var(--brand-purple)] font-semibold text-white shadow-sm'
                      : 'border-[var(--brand-lavender-muted,#e5e0f0)] bg-white text-[var(--neutral-subtle,#6b7280)] hover:border-[var(--brand-mauve,#9c84c0)] hover:text-[var(--brand-purple,#7c3aed)]',
                    disabled && 'opacity-40 pointer-events-none',
                    isAll && !sel && 'border-violet-300 text-violet-600 hover:border-violet-400',
                  )}
                >
                  <input
                    type='checkbox'
                    className='sr-only'
                    checked={sel}
                    onChange={() => toggle(sub.id)}
                  />
                  {sub.name}
                  {isAll && (
                    <span className={cn(
                      'ml-0.5 text-[9px] font-bold px-1 rounded',
                      sel ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-600',
                    )}>
                      ทั้งหมด
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        ) : null}
      </FormField>
    </AppSheetDialog>
  );
}
