import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProductCategories } from '../../../hooks/master/useProductCategories';
import { categoriesApi } from '../../../services/api';

interface Props {
  open: boolean;
  initialSelected: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
}

type Row = Record<string, unknown>;

export function CategoryPickerModal({ open, initialSelected, onClose, onConfirm }: Props) {
  const { data, isLoading, isError } = useProductCategories();
  const categories = data ?? [];
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setConfirmError('');
    }
  }, [open, initialSelected]);

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setConfirmError('');
    try {
      // เรียก GET /categories/:id/sub-categories ตาม spec — warm cache ของ
      // useSubCategoriesByCategories(['master','sub-categories',cid]) ให้ผู้เรียก
      await Promise.all(
        selected.map((cid) =>
          qc.fetchQuery({
            queryKey: ['master', 'sub-categories', cid] as const,
            queryFn: async () => {
              const raw = await categoriesApi.subCategories(cid);
              return (Array.isArray(raw) ? raw : []) as Row[];
            },
            staleTime: 5 * 60_000,
          }),
        ),
      );
      onConfirm(selected);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'โหลดหมวดย่อยไม่สำเร็จ');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-4 sm:p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">เลือกหมวดหมู่หลัก</h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">กำลังโหลด…</p>
        ) : isError ? (
          <p className="text-sm text-red-600">โหลดไม่สำเร็จ</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400">ไม่พบข้อมูลหมวด</p>
        ) : (
          <ul className="space-y-1 max-h-[50vh] overflow-y-auto">
            {categories.map((c) => (
              <li key={c.id}>
                <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="rounded border-gray-300"
                  />
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        {confirmError && (
          <p className="text-xs text-red-600">{confirmError}</p>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            {confirming ? 'กำลังโหลด…' : `ยืนยัน (${selected.length})`}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-60"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
