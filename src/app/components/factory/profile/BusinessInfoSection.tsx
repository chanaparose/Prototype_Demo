import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { LookupSelect } from '@/components/common/LookupSelect';
import { useFactoryTypes } from '@/hooks/master/useFactoryTypes';
import type { ProfileFormValues } from '@/components/factory/profile/ProfileFormTypes';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
}

export function BusinessInfoSection({ form }: Props) {
  const { register, control } = form;
  const factoryTypesQ = useFactoryTypes();

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <label className='block sm:col-span-2'>
        <span className='text-xs text-gray-500'>ชื่อโรงงาน *</span>
        <input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('factory_name', { required: true })}
        />
      </label>

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

      <label className='block'>
        <span className='text-xs text-gray-500'>เลขประจำตัวผู้เสียภาษี</span>
        <input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('tax_id')}
        />
      </label>

      <label className='block'>
        <span className='text-xs text-gray-500'>
          ขั้นต่ำในการรับผลิต (ชิ้น)
          <span className='ml-1 text-gray-400 font-normal'>— MOQ</span>
        </span>
        <input
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
      </label>

      <label className='block'>
        <span className='text-xs text-gray-500'>
          ระยะเวลาผลิต (Lead time)
          <span className='ml-1 text-gray-400 font-normal'>— เช่น 15-20 วัน</span>
        </span>
        <input
          placeholder='15-20 วัน'
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('lead_time_desc')}
        />
      </label>

      <label className='block sm:col-span-2'>
        <span className='text-xs text-gray-500'>รายละเอียด</span>
        <textarea
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[96px]'
          {...register('description')}
        />
      </label>
    </div>
  );
}
