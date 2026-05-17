import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { LookupSelect } from '@/components/common/LookupSelect';
import { useFactoryTypes } from '@/hooks/master/useFactoryTypes';
import type { ProfileFormValues } from '@/components/factory/profile/ProfileFormTypes';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
}

export function BusinessInfoSection({ form }: Props) {
  const { register, control } = form;
  const factoryTypesQ = useFactoryTypes();

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Label className='block sm:col-span-2'>
        <span className='text-xs text-gray-500'>ชื่อโรงงาน *</span>
        <Input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('factory_name', { required: true })}
        />
      </Label>

      <Controller
        control={control}
        name='factory_type_id'
        render={({ field }) => (
          <LookupSelect
            label='ประเภทโรงงาน'
            value={field.value}
            onChange={(v) => field.onChange(v)}
            queryResult={factoryTypesQ}
            getId={(o) => o.id}
            getLabel={(o) => o.label}
            placeholder='เลือกประเภทโรงงาน'
          />
        )}
      />

      <Label className='block'>
        <span className='text-xs text-gray-500'>เลขประจำตัวผู้เสียภาษี</span>
        <Input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('tax_id')}
        />
      </Label>

      <Label className='block'>
        <span className='text-xs text-gray-500'>
          ขั้นต่ำในการรับผลิต (ชิ้น)
          <span className='ml-1 text-gray-400 font-normal'>— MOQ</span>
        </span>
        <Input
          type='number'
          inputMode='numeric'
          min={0}
          placeholder='500'
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('min_order', {
            setValueAs: (v) => {
              if (v === '' || v == null) return null;
              const n = Number(v);
              return Number.isFinite(n) && n > 0 ? n : null;
            },
          })}
        />
      </Label>

      <Label className='block'>
        <span className='text-xs text-gray-500'>
          ระยะเวลาผลิต (Lead time)
          <span className='ml-1 text-gray-400 font-normal'>— เช่น 15-20 วัน</span>
        </span>
        <Input
          placeholder='15-20 วัน'
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('lead_time_desc')}
        />
      </Label>

      <Label className='block sm:col-span-2'>
        <span className='text-xs text-gray-500'>รายละเอียด</span>
        <Textarea
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[96px]'
          {...register('description')}
        />
      </Label>
    </div>
  );
}
