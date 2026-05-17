import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  pageLabel: string;
  onLoad: () => void;
};

/** แสดงเมื่อใช้ ?manualApi=1 (dev) — กดแล้วค่อย mount โหลด API ของหน้านั้น */
export function ManualApiDevGate({ pageLabel, onLoad }: Props) {
  return (
    <div className='min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 bg-[#F8F6FA]'>
      <div className='max-w-md w-full rounded-2xl border border-violet-200 bg-white p-6 shadow-sm text-center space-y-4'>
        <p className='text-sm font-semibold text-[#2E2252]'>โหมดดู Network (dev)</p>
        <p className='text-xs text-gray-600 leading-relaxed'>
          หน้า <span className='font-medium'>{pageLabel}</span> ยังไม่เรียก API — เปิดแท็บ Network
          แล้วกดปุ่มด้านล่างเพื่อโหลดทีละชุดจากหน้านี้
        </p>
        <p className='text-[11px] text-gray-400 font-mono break-all'>?manualApi=1</p>
        <p className='text-[10px] text-gray-400'>
          console แบบเต็ม:{' '}
          <span className='font-mono'>
            localStorage.setItem(&apos;VERBOSE_API_LOG&apos;,&apos;1&apos;)
          </span>
        </p>
        <Button
          variant='unstyled'
          type='button'
          onClick={onLoad}
          className='w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#A238FF] hover:bg-[#8B2BE2] transition-colors'
        >
          โหลดข้อมูลจาก API
        </Button>
      </div>
    </div>
  );
}
