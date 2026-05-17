import React from 'react';

type Props = {
  rfqId: number;
};

export function RFQReferencePanel({ rfqId }: Props) {
  return (
    <aside className='rounded-2xl border border-gray-100 bg-white p-4 sticky top-4'>
      <p className='text-xs uppercase tracking-wide text-gray-400'>RFQ Reference</p>
      <p className='text-base font-bold text-gray-900 mt-1'>RFQ #{rfqId}</p>
      <p className='text-xs text-gray-500 mt-2'>ข้อมูล RFQ ต้นทางจะแสดงฝั่งนี้แบบอ่านอย่างเดียว</p>
    </aside>
  );
}
