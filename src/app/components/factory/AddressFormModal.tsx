import React, { useEffect, useState } from 'react';
import { LbiAddressPicker, type LbiAddressValue } from '../common/LbiAddressPicker';

type Row = Record<string, unknown>;

export type AddressFormPayload = {
  address_type: 'M' | 'B' | 'S';
  address_detail: string;
  sub_district_id: number;
  district_id: number;
  province_id: number;
  zip_code: string;
  is_default?: boolean;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Row | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: AddressFormPayload, editingId?: string | number) => Promise<void>;
};

function readAddressType(row: Row | null | undefined): 'M' | 'B' | 'S' {
  const t = String(row?.address_type ?? '').toUpperCase();
  if (t === 'B' || t === 'S') return t;
  return 'M';
}

export function AddressFormModal({ open, mode, initial, saving, onClose, onSubmit }: Props) {
  const [addressType, setAddressType] = useState<'M' | 'B' | 'S'>('M');
  const [pickerValue, setPickerValue] = useState<LbiAddressValue>({
    provinceId: '',
    districtId: '',
    subDistrictId: '',
  });
  const [zipCode, setZipCode] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const provinceId = String(initial?.province_id ?? '').trim();
    const districtId = String(initial?.district_id ?? '').trim();
    const subDistrictId = String(initial?.sub_district_id ?? '').trim();
    setAddressType(readAddressType(initial));
    setPickerValue({ provinceId, districtId, subDistrictId });
    setZipCode(String(initial?.zip_code ?? '').trim());
    setDetail(String(initial?.address_detail ?? '').trim());
    setIsDefault(Boolean(initial?.is_default));
    setError('');
  }, [open, initial]);

  if (!open) return null;

  const submit = async () => {
    const zip = zipCode.trim();
    const addr = detail.trim();
    if (!pickerValue.provinceId || !pickerValue.districtId || !pickerValue.subDistrictId || !addr || !zip) {
      setError('กรุณากรอกข้อมูลที่อยู่ให้ครบทุกช่องที่มี *');
      return;
    }
    if (!/^\d{5}$/.test(zip)) {
      setError('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
      return;
    }
    const province_id = Number(pickerValue.provinceId);
    const district_id = Number(pickerValue.districtId);
    const sub_district_id = Number(pickerValue.subDistrictId);
    if (!Number.isFinite(province_id) || !Number.isFinite(district_id) || !Number.isFinite(sub_district_id)) {
      setError('ข้อมูลจังหวัด/อำเภอ/ตำบลไม่ถูกต้อง');
      return;
    }

    const payload: AddressFormPayload = {
      address_type: addressType,
      address_detail: addr,
      province_id,
      district_id,
      sub_district_id,
      zip_code: zip,
      ...(isDefault ? { is_default: true } : {}),
    };

    const editingId = initial?.address_id ?? initial?.id;
    await onSubmit(payload, editingId as string | number | undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-modal>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[min(90vh,100dvh)] overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'เพิ่มที่อยู่' : 'แก้ไขที่อยู่'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
            disabled={saving}
          >
            ปิด
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        ) : null}

        <label className="block sm:max-w-sm">
          <span className="text-xs text-gray-500">ประเภทที่อยู่ *</span>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={addressType}
            onChange={(e) => setAddressType(e.target.value as 'M' | 'B' | 'S')}
          >
            <option value="M">ที่อยู่หลัก</option>
            <option value="B">ออกใบกำกับภาษี</option>
            <option value="S">จัดส่ง</option>
          </select>
        </label>

        <LbiAddressPicker
          value={pickerValue}
          onChange={setPickerValue}
          onZipCodeAutoFill={(nextZip) => {
            if (/^\d{5}$/.test(nextZip)) setZipCode(nextZip);
          }}
          disabled={saving}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="text-xs text-gray-500">รหัสไปรษณีย์ *</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={zipCode}
              inputMode="numeric"
              maxLength={5}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="10110"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">ที่อยู่ *</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-gray-300 text-[#A238FF] focus:ring-[#A238FF]"
          />
          ตั้งเป็นค่าเริ่มต้น
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
          >
            {saving ? 'กำลังบันทึก...' : mode === 'create' ? 'เพิ่มที่อยู่' : 'บันทึกการแก้ไข'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
