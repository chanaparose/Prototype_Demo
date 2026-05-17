import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProductCategories } from '@/hooks/master/useProductCategories';
import { categoriesApi } from '@/services/api';
import { BaseModal } from '@/shared/ui';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  initialSelected: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
}

type Row = Record<string, unknown>;
type SubCategoryOption = { id: number; name: string; categoryId: number };

function toSubCategoryOption(r: Row, categoryIdHint: number): SubCategoryOption | null {
  const id = Number(
    r.sub_category_id ??
      r.subCategoryId ??
      r.subcategory_id ??
      r.sub_id ??
      r.subId ??
      r.lbi_sub_category_id,
  );
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? categoryIdHint);
  const name = String(r.name ?? r.name_th ?? r.sub_category_name ?? '').trim();
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  if (!name) return null;
  return { id, name, categoryId };
}

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
              const arr = (Array.isArray(raw) ? raw : []) as Row[];
              const normalized = arr
                .map((r) => toSubCategoryOption(r, cid))
                .filter((x): x is SubCategoryOption => x != null);
              const uniq = new Map<number, SubCategoryOption>();
              for (const item of normalized) {
                if (!uniq.has(item.id)) uniq.set(item.id, item);
              }
              return [...uniq.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
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
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title='เลือกหมวดหมู่หลัก'
      placement='bottom'
      size='lg'
      className='sm:rounded-2xl max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4'
      closeOnBackdropClick={!confirming}
      footerClassName='p-4 sm:p-5 pt-2 grid grid-cols-[1fr_auto] gap-2'
      footer={
        <>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className='py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60'
            style={{
              background:
                'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-violet) 100%)',
            }}
          >
            {confirming ? 'กำลังโหลด…' : `ยืนยัน (${selected.length})`}
          </Button>
          <Button
            onClick={onClose}
            disabled={confirming}
            variant='outline'
            className='px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-60'
          >
            ยกเลิก
          </Button>
        </>
      }
    >
      {isLoading ? (
        <p className='text-sm text-gray-400'>กำลังโหลด…</p>
      ) : isError ? (
        <p className='text-sm text-red-600'>โหลดไม่สำเร็จ</p>
      ) : categories.length === 0 ? (
        <p className='text-sm text-gray-400'>ไม่พบข้อมูลหมวด</p>
      ) : (
        <ul className='space-y-1 max-h-[50vh] overflow-y-auto'>
          {categories.map((c) => (
            <li key={c.id}>
              <label className='flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className='rounded border-gray-300'
                />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      {confirmError && <p className='text-xs text-red-600'>{confirmError}</p>}
    </BaseModal>
  );
}
