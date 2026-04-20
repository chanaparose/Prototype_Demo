import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { LookupSelect } from '../../common/LookupSelect';
import { useFactoryTypes } from '../../../hooks/master/useFactoryTypes';
import type { ProfileFormValues } from './ProfileFormTypes';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
}

export function BusinessInfoSection({ form }: Props) {
  const { register, control } = form;
  const factoryTypesQ = useFactoryTypes();

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 mb-4">ข้อมูลธุรกิจ</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs text-gray-500">ชื่อโรงงาน *</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            {...register('factory_name', { required: true })}
          />
        </label>

        <Controller
          control={control}
          name="factory_type_id"
          render={({ field }) => (
            <LookupSelect
              label="ประเภทโรงงาน"
              value={field.value}
              onChange={(v) => field.onChange(v)}
              queryResult={factoryTypesQ}
              getId={(o) => o.id}
              getLabel={(o) => o.label}
              placeholder="เลือกประเภทโรงงาน"
            />
          )}
        />

        <label className="block">
          <span className="text-xs text-gray-500">เลขประจำตัวผู้เสียภาษี</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            {...register('tax_id')}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs text-gray-500">รายละเอียด</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[96px]"
            {...register('description')}
          />
        </label>
      </div>
    </section>
  );
}
