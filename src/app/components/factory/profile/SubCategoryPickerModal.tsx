import React, { useEffect, useState } from 'react';
import { useSubCategoriesByCategories } from '../../../hooks/master/useSubCategoriesByCategory';

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
  const subs = categoryId != null ? byCategory.get(categoryId) ?? [] : [];
  const [working, setWorking] = useState<number[]>(initialSelected);

  useEffect(() => {
    if (open) setWorking(initialSelected);
  }, [open, initialSelected]);

  if (!open || categoryId == null) return null;

  const toggle = (id: number) => {
    setWorking((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const selectedInScope = subs.filter((s) => working.includes(s.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">เลือกหมวดย่อย</h3>
          <p className="text-xs text-gray-500">ภายใต้: {categoryName}</p>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-400">กำลังโหลด…</p>
        ) : isError ? (
          <p className="text-sm text-red-600">โหลดไม่สำเร็จ</p>
        ) : subs.length === 0 ? (
          <p className="text-sm text-gray-400">ไม่มีหมวดย่อยสำหรับหมวดนี้</p>
        ) : (
          <ul className="space-y-1 max-h-[50vh] overflow-y-auto">
            {subs.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={working.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded border-gray-300"
                  />
                  {s.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onConfirm(working)}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' }}
          >
            ยืนยัน ({selectedInScope} ในหมวดนี้)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
