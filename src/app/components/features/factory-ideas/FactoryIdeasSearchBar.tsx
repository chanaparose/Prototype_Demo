import { useState } from 'react';
import { Check, Package } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import {
  FACTORY_IDEAS_MOQ_OPTIONS,
  type FactoryIdeasMoqFilterValue,
} from '@/components/features/factory-ideas/factoryIdeasMoqFilter';

type FactoryIdeasSearchBarProps = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  moqFilter: FactoryIdeasMoqFilterValue;
  onMoqFilterChange: (value: FactoryIdeasMoqFilterValue) => void;
  className?: string;
  fieldClassName?: string;
  filterClassName?: string;
  searchPlaceholder?: string;
  showMoqButton?: boolean;
};

export function FactoryIdeasSearchBar({
  searchText,
  onSearchTextChange,
  moqFilter,
  onMoqFilterChange,
  className,
  fieldClassName,
  filterClassName,
  searchPlaceholder = 'ค้นหาในแท็บนี้…',
  showMoqButton = true,
}: FactoryIdeasSearchBarProps) {
  const [moqSheetOpen, setMoqSheetOpen] = useState(false);
  const moqActive = moqFilter !== 'all';
  const moqLabel =
    FACTORY_IDEAS_MOQ_OPTIONS.find((opt) => opt.value === moqFilter)?.label ?? 'ขั้นต่ำทั้งหมด';

  const pickMoq = (value: FactoryIdeasMoqFilterValue) => {
    onMoqFilterChange(value);
    setMoqSheetOpen(false);
  };

  return (
    <>
      <div className={cn('flex items-center gap-1.5', className)}>
        <MobileSearchField
          className={cn(
            'min-h-8 min-w-0 flex-1 gap-1.5 px-2.5 py-1 focus-within:ring-1',
            !showMoqButton && 'shadow-none focus-within:shadow-none',
            fieldClassName,
          )}
          noShadow={!showMoqButton}
          value={searchText}
          onChange={onSearchTextChange}
          placeholder={searchPlaceholder}
        />
        {showMoqButton ? (
        <Button
          variant='unstyled'
          type='button'
          aria-label={`กรองขั้นต่ำจำนวนการผลิต: ${moqLabel}`}
          title={moqLabel}
          onClick={() => setMoqSheetOpen(true)}
          className={cn(
            'relative h-9 w-9 shrink-0 rounded-lg border shadow-sm transition-colors',
            filterClassName,
            moqActive
              ? 'border-brand-purple/35 bg-[var(--brand-page)] text-brand-purple ring-1 ring-brand-purple/15'
              : 'border-gray-200 text-gray-500 hover:border-gray-300',
          )}
        >
          <span className='relative flex items-center justify-center'>
            <Package size={15} strokeWidth={2.25} aria-hidden />
            {moqActive ? (
              <span className='absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-brand-purple ring-1 ring-white' />
            ) : null}
          </span>
        </Button>
        ) : null}
      </div>

      {showMoqButton ? (
      <AppSheetDialog
        open={moqSheetOpen}
        onOpenChange={setMoqSheetOpen}
        title='ขั้นต่ำจำนวนการผลิต'
        bodyClassName='p-0'
      >
        <p className='border-b border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-500'>
          แสดงเฉพาะรายการที่ขั้นต่ำการผลิตไม่เกินค่าที่เลือก{' '}
          <span className='text-gray-400'>(เปรียบเทียบตัวเลข ไม่แบ่งตามหน่วย เช่น ชิ้น กก.)</span>
        </p>
        <ul className='divide-y divide-gray-100 pb-[max(0.5rem,env(safe-area-inset-bottom))]'>
          {FACTORY_IDEAS_MOQ_OPTIONS.map((opt) => {
            const selected = moqFilter === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type='button'
                  onClick={() => pickMoq(opt.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50',
                    selected
                      ? 'bg-[var(--brand-page)] font-semibold text-brand-navy'
                      : 'text-gray-700',
                  )}
                >
                  <span className='text-sm'>{opt.label}</span>
                  {selected ? (
                    <Check className='h-4 w-4 shrink-0 text-brand-purple' aria-hidden />
                  ) : (
                    <span className='h-4 w-4 shrink-0' aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </AppSheetDialog>
      ) : null}
    </>
  );
}
