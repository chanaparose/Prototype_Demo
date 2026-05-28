import React, { useEffect, useMemo, useRef } from 'react';
import { useProvinces } from '@/hooks/master/useProvinces';
import { useDistricts } from '@/hooks/master/useDistricts';
import { useSubDistricts, type SubDistrictOption } from '@/hooks/master/useSubDistricts';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Label } from '@/components/ui/label';

export type LbiAddressValue = {
  provinceId: string;
  districtId: string;
  subDistrictId: string;
};

interface Props {
  value: LbiAddressValue;
  onChange: (next: LbiAddressValue) => void;
  onZipCodeAutoFill?: (zipCode: string) => void;
  disabled?: boolean;
}

export function LbiAddressPicker({ value, onChange, onZipCodeAutoFill, disabled }: Props) {
  const provincesQ = useProvinces();
  const districtsQ = useDistricts(value.provinceId);
  const subDistrictsQ = useSubDistricts(value.districtId);

  const provinces = provincesQ.data ?? [];
  const districts = districtsQ.data ?? [];
  const subDistricts = subDistrictsQ.data ?? [];

  const selectedSub = useMemo<SubDistrictOption | null>(
    () => subDistricts.find((x) => String(x.id) === value.subDistrictId) ?? null,
    [subDistricts, value.subDistrictId],
  );

  // Keep a stable ref so the effect doesn't re-fire when the parent re-renders
  const onZipCodeAutoFillRef = useRef(onZipCodeAutoFill);
  useEffect(() => {
    onZipCodeAutoFillRef.current = onZipCodeAutoFill;
  });

  useEffect(() => {
    if (selectedSub?.zipCode) {
      onZipCodeAutoFillRef.current?.(selectedSub.zipCode);
    }
  }, [selectedSub]);

  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <Cell
        label='จังหวัด *'
        value={value.provinceId}
        loading={provincesQ.isLoading}
        disabled={disabled}
        options={provinces.map((p) => ({ id: p.id, name: p.name }))}
        placeholder='เลือกจังหวัด'
        onChange={(v) => onChange({ provinceId: v, districtId: '', subDistrictId: '' })}
      />
      <Cell
        label='เขต/อำเภอ *'
        value={value.districtId}
        loading={districtsQ.isLoading}
        disabled={disabled || !value.provinceId}
        options={districts.map((d) => ({ id: d.id, name: d.name }))}
        placeholder='เลือกเขต/อำเภอ'
        onChange={(v) => onChange({ ...value, districtId: v, subDistrictId: '' })}
      />
      <Cell
        label='แขวง/ตำบล *'
        value={value.subDistrictId}
        loading={subDistrictsQ.isLoading}
        disabled={disabled || !value.districtId}
        options={subDistricts.map((s) => ({ id: s.id, name: s.name }))}
        placeholder='เลือกแขวง/ตำบล'
        onChange={(v) => onChange({ ...value, subDistrictId: v })}
      />
    </div>
  );
}

interface CellProps {
  label: string;
  value: string;
  loading: boolean;
  disabled: boolean | undefined;
  options: Array<{ id: number; name: string }>;
  placeholder: string;
  onChange: (v: string) => void;
}

function Cell({ label, value, loading, disabled, options, placeholder, onChange }: CellProps) {
  return (
    <Label className='block'>
      <span className='text-xs text-gray-500'>{label}</span>
      <div className='mt-1'>
        <SearchableSelect
          value={value}
          onValueChange={(next) => onChange(next)}
          options={options.map((o) => ({ value: String(o.id), label: o.name }))}
          placeholder={loading ? 'กำลังโหลด…' : placeholder}
          searchPlaceholder='พิมพ์เพื่อค้นหา…'
          disabled={disabled || loading}
          loading={loading}
        />
      </div>
    </Label>
  );
}
