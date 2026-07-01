import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@lib/utils';
import { masterKeys } from '@/lib/queryKeys';
import { categoriesApi } from '@/services/api/masterApi';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import type { IHubResponse } from '@/services/api/types/master.types';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';

type Row = Record<string, unknown>;
type SubCategoryOption = { id: number; name: string; categoryId: number };

function toSubCategoryOption(r: Row, categoryIdHint: number): SubCategoryOption | null {
  const id = Number(
    r.sub_category_id ?? r.subCategoryId ?? r.subcategory_id ?? r.sub_id ?? r.lbi_sub_category_id,
  );
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? categoryIdHint);
  const name = String(r.name ?? r.name_th ?? r.sub_category_name ?? '').trim();
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  if (!name) return null;
  return { id, name, categoryId };
}

interface Props {
  open: boolean;
  /** category_ids ที่เลือกไว้แล้วทั้งหมด (ทุก hub) */
  currentCategoryIds: number[];
  onClose: () => void;
  /** category_ids ใหม่ทั้งหมด (รวม hub อื่นที่ไม่ได้แตะ + ที่เลือกใน hub นี้) */
  onConfirm: (categoryIds: number[]) => void;
}

export function AddHubModal({ open, currentCategoryIds, onClose, onConfirm }: Props) {
  const { data: hubs = [], isLoading, isError } = useLbiHubsQuery();
  const [selectedHub, setSelectedHub] = useState<IHubResponse | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setSelectedHub(null);
      setSelectedCategoryIds([]);
      setConfirmError('');
    }
  }, [open]);

  const pdHubs = hubs.filter((h) => h.scope === 'PD');
  const mtHubs = hubs.filter((h) => h.scope === 'MT');

  const pickHub = (hub: IHubResponse) => {
    setSelectedHub(hub);
    const hubCategoryIds = new Set(hub.categories.map((c) => c.category_id));
    setSelectedCategoryIds(currentCategoryIds.filter((id) => hubCategoryIds.has(id)));
    setConfirmError('');
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
    setConfirmError('');
  };

  const handleConfirm = async () => {
    if (confirming || !selectedHub) return;
    if (selectedCategoryIds.length === 0) {
      setConfirmError('เลือกอย่างน้อย 1 หมวดหมู่ใน Hub นี้');
      return;
    }
    setConfirming(true);
    setConfirmError('');
    try {
      if (selectedHub.scope !== 'MT') {
        await Promise.all(
          selectedCategoryIds.map((cid) =>
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
      }
      const hubCategoryIds = new Set(selectedHub.categories.map((c) => c.category_id));
      const otherHubIds = currentCategoryIds.filter((id) => !hubCategoryIds.has(id));
      const merged = Array.from(new Set([...otherHubIds, ...selectedCategoryIds])).sort(
        (a, b) => a - b,
      );
      onConfirm(merged);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'โหลดหมวดย่อยไม่สำเร็จ');
    } finally {
      setConfirming(false);
    }
  };

  const renderHubGroup = (label: string, items: IHubResponse[], accentClass: string) => (
    <div className='space-y-2'>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${accentClass}`}>{label}</p>
      <div className='flex flex-wrap gap-2'>
        {items.map((h) => (
          <button
            key={h.hub_id}
            type='button'
            onClick={() => pickHub(h)}
            className='inline-flex select-none items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 transition-all hover:border-brand-mauve hover:text-brand-purple'
          >
            {h.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={selectedHub ? `เลือกหมวดหมู่ใน "${selectedHub.name}"` : 'เพิ่ม Hub'}
      className='sm:max-w-lg'
      bodyClassName='p-4 sm:p-5 space-y-4 bg-white'
      footer={
        selectedHub ? (
          <ModalFooter
            layout='grid-compact'
            accent='purple'
            primary={{
              label: `ยืนยัน (${selectedCategoryIds.length})`,
              loadingLabel: 'กำลังโหลด…',
              loading: confirming,
              disabled: confirming,
              onClick: handleConfirm,
            }}
            secondary={{ label: 'ยกเลิก', onClick: onClose, disabled: confirming, tone: 'muted' }}
          />
        ) : (
          <div className='flex w-full justify-end'>
            <Button
              variant='unstyled'
              type='button'
              onClick={onClose}
              className='rounded-lg border border-gray-200 px-4 py-2 text-sm font-normal text-gray-700 hover:bg-gray-50'
            >
              ยกเลิก
            </Button>
          </div>
        )
      }
    >
      {selectedHub ? (
        <div className='space-y-4'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setSelectedHub(null)}
            className='inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-purple'
          >
            <ChevronLeft size={13} /> เปลี่ยน Hub
          </Button>
          <FormField error={confirmError}>
            <div className='flex flex-wrap gap-2 max-h-[45vh] overflow-y-auto pr-1'>
              {selectedHub.categories.map((c) => (
                <label
                  key={c.category_id}
                  className={cn(
                    'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                    selectedCategoryIds.includes(c.category_id)
                      ? 'border-[var(--brand-purple)] bg-[var(--brand-purple)] font-semibold text-white shadow-sm'
                      : 'border-[var(--brand-lavender-muted,#e5e0f0)] bg-white text-[var(--neutral-subtle,#6b7280)] hover:border-[var(--brand-mauve,#9c84c0)] hover:text-[var(--brand-purple,#7c3aed)]',
                  )}
                >
                  <input
                    type='checkbox'
                    className='sr-only'
                    checked={selectedCategoryIds.includes(c.category_id)}
                    onChange={() => toggleCategory(c.category_id)}
                  />
                  {c.name}
                </label>
              ))}
              {selectedHub.categories.length === 0 && (
                <p className='text-sm text-gray-400'>Hub นี้ยังไม่มีหมวดหมู่</p>
              )}
            </div>
          </FormField>
        </div>
      ) : (
        <FormField error={isError ? 'โหลดไม่สำเร็จ' : undefined}>
          {isLoading ? (
            <p className='text-sm text-gray-400'>กำลังโหลด…</p>
          ) : hubs.length === 0 && !isError ? (
            <p className='text-sm text-gray-400'>ไม่พบ Hub</p>
          ) : !isError ? (
            <div className='space-y-4 max-h-[55vh] overflow-y-auto pr-1'>
              {pdHubs.length > 0 && renderHubGroup('หมวดสินค้า (PD)', pdHubs, 'text-brand-purple')}
              {mtHubs.length > 0 && renderHubGroup('หมวดวัตถุดิบ (MT)', mtHubs, 'text-emerald-600')}
            </div>
          ) : null}
        </FormField>
      )}
    </AppSheetDialog>
  );
}
