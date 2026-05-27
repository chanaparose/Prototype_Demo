import React from 'react';
import { History } from 'lucide-react';
import { AppDialog } from '@/components/ui/app-dialog';
import { HistoryRfqRow } from '@/components/features/rfq-and-orders/components/HistoryRfqRow';
import { type Rfq } from '@/stores/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyRfqs: Rfq[];
};

export function HistoryRfqPopup({ open, onOpenChange, historyRfqs }: Props) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title='ประวัติใบขอราคา'
      variant='sheet'
      size='md'
      bodyClassName='p-3 sm:p-4'
    >
      {historyRfqs.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <div className='mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--neutral-muted)]'>
            <History size={16} className='text-[var(--neutral-placeholder)]' />
          </div>
          <p className='text-sm font-semibold text-gray-700'>ยังไม่มีประวัติใบขอราคา</p>
        </div>
      ) : (
        <div className='space-y-1.5'>
          {historyRfqs.map((rfq) => (
            <HistoryRfqRow key={rfq.id} rfq={rfq} />
          ))}
        </div>
      )}
    </AppDialog>
  );
}
