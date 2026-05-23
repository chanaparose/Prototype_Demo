import React from 'react';

interface Props {
  status: string;
}

export function VerifyStatusBanner({ status }: Readonly<Props>) {
  const s = (status || 'PD').toUpperCase();
  if (s === 'AP') {
    return (
      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200'>
        ✓ ยืนยันแล้ว (Verified)
      </span>
    );
  }
  if (s === 'RJ') {
    return (
      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-800 border-red-200'>
        ถูกปฏิเสธ (Rejected)
      </span>
    );
  }
  return (
    <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-900 border-amber-200'>
      รอแอดมินตรวจสอบ
    </span>
  );
}
