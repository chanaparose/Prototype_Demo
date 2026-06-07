import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import type { ProfileFormValues } from '@/components/factory/profile/ProfileFormTypes';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
}

export function BusinessInfoSection({ form }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Label className='block sm:col-span-2'>
        <span className='text-xs text-gray-500'>ชื่อโรงงาน *</span>
        <Input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('factory_name')}
        />
        {errors.factory_name?.message ? (
          <p className='text-xs text-red-600 mt-1'>{errors.factory_name.message}</p>
        ) : null}
      </Label>

      <Label className='block'>
        <span className='text-xs text-gray-500'>เลขประจำตัวผู้เสียภาษี</span>
        <Input
          className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('tax_id')}
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
