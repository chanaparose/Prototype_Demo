import React, { useEffect, useState } from 'react';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { BaseModal } from '@/shared/ui/modals/BaseModal';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

  useEffect(() => {
    if (open) setWorking(initialSelected);
  }, [open, initialSelected]);

  if (!open || categoryId == null) return null;

  const toggle = (id: number) => {
    if (!Number.isFinite(id) || id <= 0) return;
    setWorking((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const selectedInScope = subs.filter((s) => working.includes(s.id)).length;

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title='เลือกหมวดย่อย'
      placement='bottom'
      size='lg'
      className='sm:rounded-2xl max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4'
      footerClassName='p-4 sm:p-5 pt-2 grid grid-cols-[1fr_auto] gap-2'
      footer={
        <ModalFooter
          layout='grid-compact'
          accent='teal'
          primary={{
            label: `ยืนยัน (${selectedInScope} ในหมวดนี้)`,
            onClick: () => onConfirm(working),
          }}
          secondary={{ label: 'ยกเลิก', onClick: onClose, tone: 'muted' }}
        />
      }
    >
      <FormField
        helperText={`ภายใต้: ${categoryName}`}
        error={isError ? 'โหลดไม่สำเร็จ' : undefined}
      >
        {isLoading ? (
          <p className='text-sm text-gray-400'>กำลังโหลด…</p>
        ) : subs.length === 0 && !isError ? (
          <p className='text-sm text-gray-400'>ไม่มีหมวดย่อยสำหรับหมวดนี้</p>
        ) : !isError ? (
          <ul className='space-y-1 max-h-[50vh] overflow-y-auto'>
            {subs.map((s) => (
              <li key={s.id}>
                <Label className='flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer'>
                  <Checkbox
                    checked={working.includes(s.id)}
                    onCheckedChange={() => toggle(s.id)}
                  />
                  {s.name}
                </Label>
              </li>
            ))}
          </ul>
        ) : null}
      </FormField>
    </BaseModal>
  );
}
