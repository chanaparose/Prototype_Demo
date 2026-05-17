import React from 'react';
import { Button } from '../../ui/button';

export function BankAccountPlaceholder() {
  return (
    <section className="bg-white rounded-2xl border border-dashed border-gray-300 p-4 sm:p-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">บัญชีธนาคาร</h2>
      <p className="text-xs text-gray-500">ยังไม่ได้ผูกบัญชีธนาคาร</p>
      <Button
        disabled
        variant="secondary"
        className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        + ผูกบัญชี (เร็วๆ นี้)
      </Button>
    </section>
  );
}
