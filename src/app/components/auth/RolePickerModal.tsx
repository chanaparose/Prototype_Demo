import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Factory, ShoppingBag } from 'lucide-react';

export type RoleChoice = 'CT' | 'FT';

interface RolePickerModalProps {
  open: boolean;
  loading: boolean;
  onPick: (role: RoleChoice) => void;
}

const ROLES: { value: RoleChoice; label: string; desc: string; Icon: React.ElementType }[] = [
  {
    value: 'CT',
    label: 'ผู้ซื้อ (Customer)',
    desc: 'ค้นหาสินค้าและโรงงาน สร้างคำขอผลิต',
    Icon: ShoppingBag,
  },
  {
    value: 'FT',
    label: 'โรงงาน (Factory)',
    desc: 'จัดการโรงงาน รับคำขอผลิต เสนอราคา',
    Icon: Factory,
  },
];

export function RolePickerModal({ open, loading, onPick }: RolePickerModalProps) {
  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className='fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <div
            className='rounded-t-3xl px-6 pt-7 pb-5 text-center'
            style={{ background: 'linear-gradient(135deg, #f3f0ff 0%, #ede9fe 50%, #faf5ff 100%)' }}
          >
            <DialogPrimitive.Title className='text-lg font-bold text-gray-900'>
              เลือกโหมดการใช้งาน
            </DialogPrimitive.Title>
            <p className='mt-1 text-xs text-gray-500'>
              บัญชีของคุณมีทั้งสิทธิ์ผู้ซื้อและโรงงาน
            </p>
          </div>

          <div className='px-6 pb-6 pt-5 space-y-3'>
            {ROLES.map(({ value, label, desc, Icon }) => (
              <button
                key={value}
                type='button'
                disabled={loading}
                onClick={() => onPick(value)}
                className='w-full flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-left transition-all hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98] disabled:opacity-50'
              >
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600'>
                  <Icon size={24} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-bold text-gray-900'>{label}</p>
                  <p className='text-[11px] text-gray-500 leading-snug mt-0.5'>{desc}</p>
                </div>
              </button>
            ))}

            {loading && (
              <div className='flex items-center justify-center gap-2 pt-1'>
                <span className='h-4 w-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin' />
                <span className='text-xs text-gray-400'>กำลังสลับบทบาท...</span>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
