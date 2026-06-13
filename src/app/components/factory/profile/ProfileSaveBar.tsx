import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { factoryButtonClass } from '@/pages/factory-portal/factoryUi';

interface Props {
  isDirty: boolean;
  changeCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function ProfileSaveBar({ isDirty, changeCount, saving, onSave, onDiscard }: Props) {
  if (!isDirty && !saving) return null;
  return (
    <div
      role='region'
      aria-label='แถบบันทึกการเปลี่ยนแปลง'
      className='fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white'
    >
      <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3'>
        <p className='text-sm text-gray-700'>
          <span className='inline-flex items-center gap-1.5'>
            <span className='w-2 h-2 rounded-full bg-amber-500' />
            มีการเปลี่ยนแปลง {changeCount > 0 ? `${changeCount} จุด` : ''}
          </span>
        </p>
        <div className='flex items-center gap-2'>
          <Button
            onClick={onDiscard}
            disabled={saving}
            variant='unstyled'
            className={factoryButtonClass({ variant: 'secondary', size: 'sm', className: 'gap-1' })}
          >
            <X size={14} /> ยกเลิก
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !isDirty}
            variant='unstyled'
            className={factoryButtonClass({ variant: 'submit', size: 'sm', className: 'gap-1' })}
          >
            <Check size={14} /> {saving ? 'กำลังบันทึก…' : 'บันทึกทั้งหมด'}
          </Button>
        </div>
      </div>
    </div>
  );
}
