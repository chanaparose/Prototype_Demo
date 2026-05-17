import React, { useEffect, useState } from 'react';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { BaseModal } from '@/shared/ui';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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
        <>
          <Button
            onClick={() => onConfirm(working)}
            className='py-3 rounded-xl text-white text-sm font-semibold'
            style={{ background: 'linear-gradient(135deg, var(--brand-teal) 0%, #14B8A6 100%)' }}
          >
            ยืนยัน ({selectedInScope} ในหมวดนี้)
          </Button>
          <Button
            onClick={onClose}
            variant='outline'
            className='px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700'
          >
            ยกเลิก
          </Button>
        </>
      }
    >
      <div>
        <p className='text-xs text-gray-500'>ภายใต้: {categoryName}</p>
      </div>
      {isLoading ? (
        <p className='text-sm text-gray-400'>กำลังโหลด…</p>
      ) : isError ? (
        <p className='text-sm text-red-600'>โหลดไม่สำเร็จ</p>
      ) : subs.length === 0 ? (
        <p className='text-sm text-gray-400'>ไม่มีหมวดย่อยสำหรับหมวดนี้</p>
      ) : (
        <ul className='space-y-1 max-h-[50vh] overflow-y-auto'>
          {subs.map((s) => (
            <li key={s.id}>
              <label className='flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer'>
                <Checkbox checked={working.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                {s.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </BaseModal>
  );
}
