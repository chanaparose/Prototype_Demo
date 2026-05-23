import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi, categoriesApi } from '@/services/api/masterApi';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { parseCategorySelection } from '@/domain/factory/schemas/categoryPicker.schema';

interface Props {
  open: boolean;
  initialSelected: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
}

type Row = Record<string, unknown>;
type SubCategoryOption = { id: number; name: string; categoryId: number };
type CategoryWithScope = { id: number; name: string; scope: 'PD' | 'MT' | string };

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

function useLbiAllCategories() {
  return useQuery({
    queryKey: masterKeys.lbiCategories('ALL'),
    queryFn: async (): Promise<CategoryWithScope[]> => {
      const raw = await masterApi.getLbiCategories('ALL');
      const obj = raw as Record<string, unknown>;
      const arr = (
        Array.isArray(obj.categories) ? obj.categories : Array.isArray(raw) ? raw : []
      ) as Row[];
      return arr
        .map((r): CategoryWithScope | null => {
          const id = Number(r.category_id ?? r.id);
          const name = String(r.name ?? r.category_name ?? '').trim();
          const scope = String(r.scope ?? 'PD');
          if (!Number.isFinite(id) || id <= 0 || !name) return null;
          return { id, name, scope };
        })
        .filter((x): x is CategoryWithScope => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function CategoryPickerModal({ open, initialSelected, onClose, onConfirm }: Props) {
  const { data, isLoading, isError } = useLbiAllCategories();
  const categories = data ?? [];
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const qc = useQueryClient();

  const pdCategories = categories.filter((c) => c.scope === 'PD');
  const mtCategories = categories.filter((c) => c.scope === 'MT');

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setConfirmError('');
    }
  }, [open, initialSelected]);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const handleConfirm = async () => {
    if (confirming) return;
    const parsed = parseCategorySelection(selected);
    if (!parsed.success) {
      setConfirmError(parsed.error.issues[0]?.message ?? 'เลือกอย่างน้อย 1 หมวดหมู่');
      return;
    }
    setConfirming(true);
    setConfirmError('');
    const mtIdSet = new Set(mtCategories.map((c) => c.id));
    try {
      await Promise.all(
        selected
          .filter((cid) => !mtIdSet.has(cid))
          .map((cid) =>
            qc.fetchQuery({
              queryKey: masterKeys.subCategories(cid),
              queryFn: async () => {
                const raw = await categoriesApi.subCategories(cid);
                const arr = (Array.isArray(raw) ? raw : []) as unknown as Row[];
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

  const renderGroup = (label: string, items: CategoryWithScope[], accentClass: string) => (
    <div>
      <p className={`text-[11px] font-semibold mb-1.5 ${accentClass}`}>{label}</p>
      <ul className='space-y-0.5'>
        {items.map((c) => (
          <li key={c.id}>
            <Label className='flex items-center gap-2 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer'>
              <Checkbox
                checked={selected.includes(c.id)}
                onCheckedChange={() => toggle(c.id)}
              />
              {c.name}
            </Label>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title='เลือกหมวดหมู่หลัก'
      className='sm:max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4'
      footer={
        <ModalFooter
          layout='grid-compact'
          accent='purple'
          primary={{
            label: `ยืนยัน (${selected.length})`,
            loadingLabel: 'กำลังโหลด…',
            loading: confirming,
            disabled: confirming,
            onClick: handleConfirm,
          }}
          secondary={{
            label: 'ยกเลิก',
            onClick: onClose,
            disabled: confirming,
            tone: 'muted',
          }}
        />
      }
    >
      <FormField error={confirmError || (isError ? 'โหลดไม่สำเร็จ' : undefined)}>
        {isLoading ? (
          <p className='text-sm text-gray-400'>กำลังโหลด…</p>
        ) : categories.length === 0 && !isError ? (
          <p className='text-sm text-gray-400'>ไม่พบข้อมูลหมวด</p>
        ) : !isError ? (
          <div className='space-y-4 max-h-[55vh] overflow-y-auto'>
            {pdCategories.length > 0 && renderGroup('หมวดสินค้า (PD)', pdCategories, 'text-indigo-600')}
            {mtCategories.length > 0 && renderGroup('หมวดวัตถุดิบ (MT)', mtCategories, 'text-emerald-600')}
          </div>
        ) : null}
      </FormField>
    </AppSheetDialog>
  );
}
