import React, { useEffect, useMemo, useState } from 'react';
import { masterApi } from '../../services/api';

type Row = Record<string, unknown>;

type Option = {
  id: number;
  name: string;
  zipCode?: string;
};

export type LbiAddressValue = {
  provinceId: string;
  districtId: string;
  subDistrictId: string;
};

type Props = {
  value: LbiAddressValue;
  onChange: (next: LbiAddressValue) => void;
  onZipCodeAutoFill?: (zipCode: string) => void;
  disabled?: boolean;
};

function toOption(r: Row, kind: 'province' | 'district' | 'sub'): Option | null {
  const id = Number(r.province_id ?? r.district_id ?? r.sub_district_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(
    kind === 'province'
      ? r.province_name ?? r.name_th ?? r.name ?? id
      : kind === 'district'
        ? r.district_name ?? r.name_th ?? r.name ?? id
        : r.sub_district_name ?? r.name_th ?? r.name ?? id,
  ).trim();
  if (!name) return null;
  const zipCodeRaw = String(r.zip_code ?? r.postcode ?? '').trim();
  return {
    id,
    name,
    ...(zipCodeRaw ? { zipCode: zipCodeRaw } : {}),
  };
}

export function LbiAddressPicker({ value, onChange, onZipCodeAutoFill, disabled }: Props) {
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [subDistricts, setSubDistricts] = useState<Option[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    masterApi
      .provinces()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Row[];
        const opts = arr
          .map((r) => toOption(r, 'province'))
          .filter((x): x is Option => x != null)
          .sort((a, b) => a.name.localeCompare(b.name, 'th'));
        setProvinces(opts);
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pid = Number(value.provinceId);
    if (!Number.isFinite(pid) || pid <= 0) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    masterApi
      .districts(pid)
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Row[];
        const opts = arr
          .map((r) => toOption(r, 'district'))
          .filter((x): x is Option => x != null)
          .sort((a, b) => a.name.localeCompare(b.name, 'th'));
        setDistricts(opts);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.provinceId]);

  useEffect(() => {
    const did = Number(value.districtId);
    if (!Number.isFinite(did) || did <= 0) {
      setSubDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingSubDistricts(true);
    masterApi
      .subDistricts(did)
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Row[];
        const opts = arr
          .map((r) => toOption(r, 'sub'))
          .filter((x): x is Option => x != null)
          .sort((a, b) => a.name.localeCompare(b.name, 'th'));
        setSubDistricts(opts);
      })
      .catch(() => {
        if (!cancelled) setSubDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.districtId]);

  const selectedSubDistrict = useMemo(
    () => subDistricts.find((x) => String(x.id) === value.subDistrictId) ?? null,
    [subDistricts, value.subDistrictId],
  );

  useEffect(() => {
    if (!selectedSubDistrict?.zipCode || !onZipCodeAutoFill) return;
    onZipCodeAutoFill(selectedSubDistrict.zipCode);
  }, [selectedSubDistrict, onZipCodeAutoFill]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="text-xs text-gray-500">จังหวัด *</span>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={value.provinceId}
          disabled={disabled}
          onChange={(e) => {
            const provinceId = e.target.value;
            onChange({
              provinceId,
              districtId: '',
              subDistrictId: '',
            });
          }}
        >
          <option value="">เลือกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">เขต/อำเภอ *</span>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
          value={value.districtId}
          disabled={disabled || !value.provinceId || loadingDistricts}
          onChange={(e) => {
            const districtId = e.target.value;
            onChange({
              provinceId: value.provinceId,
              districtId,
              subDistrictId: '',
            });
          }}
        >
          <option value="">เลือกเขต/อำเภอ</option>
          {districts.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-gray-500">แขวง/ตำบล *</span>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
          value={value.subDistrictId}
          disabled={disabled || !value.districtId || loadingSubDistricts}
          onChange={(e) => {
            onChange({
              provinceId: value.provinceId,
              districtId: value.districtId,
              subDistrictId: e.target.value,
            });
          }}
        >
          <option value="">เลือกแขวง/ตำบล</option>
          {subDistricts.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
