import { useEffect, useState } from 'react';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    if (open) {
      setWorking(initialSelected);
      setConfirmError('');
    }
  }, [open, initialSelected]);

  if (categoryId == null) return null;

  const toggle = (id: number) => {
    if (!Number.isFinite(id) || id <= 0) return;
    setWorking((prev) => {
      const current = subs.find((s) => s.id === id);
      const allItem = subs.find((s) => Number(s.sortOrder ?? 0) === 99);
      const isAll = Number(current?.sortOrder ?? 0) === 99;
      const catSubIds = subs.map((s) => s.id);
      const hasAllSelected = allItem ? prev.includes(allItem.id) : false;

      if (prev.includes(id)) return prev.filter((x) => x !== id);

      if (isAll) {
        return [...prev.filter((x) => !catSubIds.includes(x)), id].sort((a, b) => a - b);
      }
      if (allItem && hasAllSelected) {
        return [...prev.filter((x) => x !== allItem.id), id].sort((a, b) => a - b);
      }
      return [...prev, id].sort((a, b) => a - b);
    });
  };

  const selectedInScope = subs.filter((s) => working.includes(s.id)).length;

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title='เลือกหมวดย่อย'
      className='sm:max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4 bg-white'
      footer={
        <ModalFooter
          layout='grid-compact'
          accent='teal'
          primary={{
            label: `ยืนยัน (${selectedInScope} ในหมวดนี้)`,
            onClick: () => {
              const inScopeIds = subs.filter((s) => working.includes(s.id)).map((s) => s.id);
              const parsed = parseSubCategorySelection(inScopeIds);
              if (!parsed.success) {
                setConfirmError(parsed.error.issues[0]?.message ?? 'เลือกอย่างน้อย 1 หมวดหมู่ย่อย');
                return;
              }
              onConfirm(working);
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
          <ul className='space-y-2 max-h-[50vh] overflow-y-auto pr-1'>
            {subs.map((s) => (
              <li key={s.id}>
                {(() => {
                  const allItem = subs.find((item) => Number(item.sortOrder ?? 0) === 99);
                  const isAll = Number(s.sortOrder ?? 0) === 99;
                  const allSelected = allItem ? working.includes(allItem.id) : false;
                  return (
                    <Label
                      className={`flex items-center justify-between gap-3 text-sm px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                        working.includes(s.id)
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      } ${!isAll && allSelected ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <span className='min-w-0 truncate font-medium text-gray-700'>{s.name}</span>
                      <Checkbox checked={working.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                    </Label>
                  );
                })()}
              </li>
            ))}
          </ul>
        ) : null}
      </FormField>
    </AppSheetDialog>
  );
}
