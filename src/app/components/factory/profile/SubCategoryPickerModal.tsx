import { useEffect, useState } from 'react';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { SubCategoryPickerField } from '@/components/factory/profile/SubCategoryPickerField';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { parseSubCategorySelection } from '@/domain/factory/schemas/categoryPicker.schema';
import { subsForDisplay } from '@/components/factory/profile/subCategoryPicker.utils';

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

  const displayWorking = subsForDisplay(working, subs);
  const selectedInScope = subs.filter((s) => displayWorking.includes(s.id)).length;

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
        <SubCategoryPickerField
          subs={subs}
          selectedIds={working}
          onChange={setWorking}
          isLoading={isLoading}
        />
      </FormField>
    </AppSheetDialog>
  );
}
