import React from 'react';
import type { QuotationCreateInput } from '@/services/api/types/rfq.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  items: QuotationCreateInput['items'];
  onChange: (items: QuotationCreateInput['items']) => void;
};

export function LineItemTable({ items, onChange }: Props) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-4'>
      <p className='text-sm font-bold text-gray-900 mb-3'>Line Items</p>
      <div className='space-y-2'>
        {items.map((it, idx) => (
          <div key={idx} className='grid grid-cols-12 gap-2'>
            <Input
              className='col-span-5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs'
              value={it.description}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], description: e.target.value };
                onChange(next);
              }}
              placeholder='Description'
            />
            <Input
              type='number'
              className='col-span-2 rounded-lg border border-gray-200 px-2 py-1.5 text-xs'
              value={it.qty}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], qty: Number(e.target.value) || 0 };
                onChange(next);
              }}
              placeholder='Qty'
            />
            <Input
              className='col-span-2 rounded-lg border border-gray-200 px-2 py-1.5 text-xs'
              value={it.unit ?? ''}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], unit: e.target.value };
                onChange(next);
              }}
              placeholder='Unit'
            />
            <Input
              type='number'
              className='col-span-3 rounded-lg border border-gray-200 px-2 py-1.5 text-xs'
              value={it.unit_price}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], unit_price: Number(e.target.value) || 0 };
                onChange(next);
              }}
              placeholder='Unit price'
            />
          </div>
        ))}
      </div>
      <Button
        variant='unstyled'
        type='button'
        className='mt-3 text-xs font-semibold text-violet-600'
        onClick={() =>
          onChange([
            ...items,
            {
              item_no: items.length + 1,
              description: '',
              qty: 1,
              unit: 'pcs',
              unit_price: 0,
              discount_pct: 0,
            },
          ])
        }
      >
        + Add row
      </Button>
    </div>
  );
}
