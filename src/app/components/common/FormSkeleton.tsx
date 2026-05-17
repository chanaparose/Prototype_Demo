import React from 'react';

interface Props {
  sections?: number;
  linesPerSection?: number;
}

export function FormSkeleton({ sections = 3, linesPerSection = 4 }: Props) {
  return (
    <div className='space-y-6 animate-pulse' aria-busy aria-label='กำลังโหลดข้อมูล'>
      {Array.from({ length: sections }).map((_, s) => (
        <section
          key={s}
          className='bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm'
        >
          <div className='h-4 w-40 bg-gray-200 rounded mb-4' />
          <div className='space-y-3'>
            {Array.from({ length: linesPerSection }).map((__, i) => (
              <div key={i} className='h-9 w-full bg-gray-100 rounded-xl' />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
