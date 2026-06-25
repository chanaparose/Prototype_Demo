import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import {
  FACTORY_IDEAS_MOQ_OPTIONS,
  type FactoryIdeasMoqFilterValue,
} from '@/components/features/factory-ideas/factoryIdeasMoqFilter';

type FactoryIdeasMoqFilterChipProps = {
  moqFilter: FactoryIdeasMoqFilterValue;
  onMoqFilterChange: (value: FactoryIdeasMoqFilterValue) => void;
  className?: string;
};

export function FactoryIdeasMoqFilterChip({
  moqFilter,
  onMoqFilterChange,
  className,
}: FactoryIdeasMoqFilterChipProps) {
  const [open, setOpen] = useState(false);
  const active = moqFilter !== 'all';
  const moqLabel =
    FACTORY_IDEAS_MOQ_OPTIONS.find((opt) => opt.value === moqFilter)?.label ?? 'ขั้นต่ำทั้งหมด';
  const chipLabel = active ? moqLabel : 'ขั้นต่ำ';

  const pickMoq = (value: FactoryIdeasMoqFilterValue) => {
    onMoqFilterChange(value);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant='unstyled'
        type='button'
        aria-label={`กรองขั้นต่ำจำนวนการผลิต: ${moqLabel}`}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-8 min-w-0 items-center justify-center gap-0.5 rounded-full border px-1.5 text-[11px] font-medium transition-colors',
          active
            ? 'border-brand-purple/30 bg-brand-lavender-chip/70 text-brand-violet-deep'
            : 'border-gray-200/90 bg-white/80 text-slate-600',
          className,
        )}
      >
        <span className='truncate'>{chipLabel}</span>
        <ChevronDown size={12} strokeWidth={2.25} className='shrink-0 opacity-60' />
      </Button>

      <AppSheetDialog open={open} onOpenChange={setOpen} title='ขั้นต่ำจำนวนการผลิต' bodyClassName='p-0'>
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
    </>
  );
}
