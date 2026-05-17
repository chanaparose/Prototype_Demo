import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  discount_amount: number;
  shipping_cost: number;
  packaging_cost: number;
  tooling_mold_cost: number;
  onChange: (next: {
    discount_amount: number;
    shipping_cost: number;
    packaging_cost: number;
    tooling_mold_cost: number;
  }) => void;
};

export function ExtraChargesForm(props: Props) {
  const charges = {
    discount_amount: props.discount_amount,
    shipping_cost: props.shipping_cost,
    packaging_cost: props.packaging_cost,
    tooling_mold_cost: props.tooling_mold_cost,
  };
  const row = (key: keyof Omit<Props, 'onChange'>, label: string) => (
    <Label className='block'>
      <span className='text-xs text-gray-500'>{label}</span>
      <Input
        type='number'
        value={props[key] as number}
        onChange={(e) => props.onChange({ ...charges, [key]: Number(e.target.value) || 0 })}
        className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
    </Label>
  );
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-4 space-y-3'>
      <p className='text-sm font-bold text-gray-900'>Extra Charges</p>
      {row('discount_amount', 'Discount amount')}
      {row('shipping_cost', 'Shipping cost')}
      {row('packaging_cost', 'Packaging cost')}
      {row('tooling_mold_cost', 'Tooling/mold cost')}
    </div>
  );
}
