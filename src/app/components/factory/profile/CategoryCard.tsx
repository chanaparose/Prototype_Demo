import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { SubCategoryOption } from '@/hooks/master/useSubCategoriesByCategory';
import { factoriesApi } from '@/services/api/factoryApi';
import { Button } from '@/components/ui/button';

interface Props {
  factoryId: number | string;
  categoryId: number;
  categoryName: string;
  subCategoriesForCategory: SubCategoryOption[];
  selectedSubIds: number[];
  onEditSubs: (categoryId: number) => void;
  onRemove: (categoryId: number) => void;
  isMT?: boolean;
  /** แสดง error highlight เมื่อ PD category ไม่มี sub-category เลือกไว้ */
  hasSubError?: boolean;
}

export function CategoryCard({
  factoryId,
  categoryId,
  categoryName,
  subCategoriesForCategory,
  selectedSubIds,
  onEditSubs,
  onRemove,
  isMT = false,
  hasSubError = false,
}: Props) {
  const selectedHere = subCategoriesForCategory.filter((s) => selectedSubIds.includes(s.id));
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const qc = useQueryClient();

  const handleRemove = async () => {
    if (deleting) return;
    if (!factoryId) {
      setDeleteError('ไม่พบรหัสโรงงาน');
      return;
    }
    const confirmed = window.confirm(
      `ลบหมวด "${categoryName}" และหมวดย่อย ${selectedHere.length} รายการ?`,
    );
    if (!confirmed) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await Promise.all(selectedHere.map((s) => factoriesApi.removeSubCategory(factoryId, s.id)));
      await factoriesApi.removeCategory(factoryId, categoryId);
      await qc.invalidateQueries({ queryKey: ['factory', 'me', 'profile-init'] });
      onRemove(categoryId);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 bg-white ${hasSubError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}>
      {/* Header row */}
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-sm font-bold text-gray-900'>{categoryName}</h3>
          {!isMT ? (
            <p className='text-xs text-gray-500 mt-0.5'>
              {selectedHere.length} หมวดย่อยที่เลือกไว้
            </p>
          ) : null}
        </div>
        <div className='flex items-center gap-1.5 shrink-0'>
          {!isMT && (
            <Button
              onClick={() => onEditSubs(categoryId)}
              variant='outline'
              size='xs'
              className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50'
            >
              <Pencil size={12} /> แก้ไข
            </Button>
          )}
          <Button
            onClick={handleRemove}
            disabled={deleting}
            variant='outline'
            size='icon-xs'
            className='p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60'
            aria-label={`ลบหมวด ${categoryName}`}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
      {deleteError && <p className='text-xs text-red-600 mt-2'>{deleteError}</p>}
      {hasSubError && !isMT && (
        <p className='text-xs text-red-600 mt-1.5 flex items-center gap-1'>
          <span>⚠</span> กรุณาเลือกหมวดย่อยอย่างน้อย 1 รายการ
        </p>
      )}

      {/* Sub-categories list */}
      {!isMT &&
        (selectedHere.length > 0 ? (
          <div className='mt-3'>
            <ul className='flex flex-wrap gap-1.5 mb-2'>
              {selectedHere.map((s) => (
                <li
                  key={s.id}
                  className='inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-1'
                >
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className='mt-3 text-xs text-gray-400'>
            ยังไม่ได้เลือกหมวดย่อย — กด [แก้ไข] เพื่อเลือก
          </p>
        ))}
    </div>
  );
}
