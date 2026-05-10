import React, { useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Row = Record<string, unknown>;

type Props = {
  addresses: Row[];
  onCreate: () => void;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
  onSetDefault: (row: Row) => void;
};

const TYPE_LABEL: Record<string, string> = {
  M: 'ที่อยู่หลัก',
  B: 'ออกใบกำกับภาษี',
  S: 'จัดส่ง',
};

function rowType(row: Row): 'M' | 'B' | 'S' {
  const t = String(row.address_type ?? '').toUpperCase();
  if (t === 'B' || t === 'S') return t;
  return 'M';
}

/**
 * Renders the secondary address line: ตำบล/แขวง · อำเภอ/เขต · จังหวัด · zip
 *
 * Thai postal addresses prefix the locality with ตำบล/แขวง / อำเภอ/เขต tokens
 * — adding them makes the displayed string read naturally even when stitched
 * from raw `name_th` columns.
 */
function displayLocation(row: Row): string {
  const province = String(row.province_name ?? '').trim();
  const district = String(row.district_name ?? '').trim();
  const subDistrict = String(row.sub_district_name ?? '').trim();
  const zip = String(row.zip_code ?? '').trim();

  // Bangkok uses แขวง/เขต; other provinces use ตำบล/อำเภอ
  const isBangkok = /กรุงเทพ/.test(province);
  const subDistrictLabel = isBangkok ? 'แขวง' : 'ตำบล';
  const districtLabel = isBangkok ? 'เขต' : 'อำเภอ';

  const parts: string[] = [];
  if (subDistrict) parts.push(`${subDistrictLabel}${subDistrict}`);
  if (district) parts.push(`${districtLabel}${district}`);
  if (province) parts.push(`จ.${province}`);
  if (zip) parts.push(zip);
  return parts.length > 0 ? parts.join(' ') : '—';
}

export function AddressList({ addresses, onCreate, onEdit, onDelete, onSetDefault }: Props) {
  const grouped = useMemo(() => {
    const map: Record<'M' | 'B' | 'S', Row[]> = { M: [], B: [], S: [] };
    for (const a of addresses) {
      map[rowType(a)].push(a);
    }
    return map;
  }, [addresses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">รายการที่อยู่</h3>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          <Plus size={14} />
          เพิ่มที่อยู่
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีที่อยู่ในระบบ</p>
      ) : null}

      {(['M', 'B', 'S'] as const).map((type) => (
        <div key={type} className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">{TYPE_LABEL[type]}</p>
          {grouped[type].length === 0 ? (
            <p className="text-xs text-gray-400">ไม่มีรายการ</p>
          ) : (
            grouped[type].map((row, idx) => {
              const id = String(row.address_id ?? row.id ?? `${type}-${idx}`);
              const isDefault = Boolean(row.is_default);
              return (
                <div
                  key={id}
                  className="rounded-xl border border-gray-100 px-3 py-3 bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{TYPE_LABEL[type]}</span>
                      {isDefault ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ค่าเริ่มต้น
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{String(row.address_detail ?? '—')}</p>
                    <p className="text-xs text-gray-500 mt-1">{displayLocation(row)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isDefault ? (
                      <button
                        type="button"
                        onClick={() => onSetDefault(row)}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                      >
                        ตั้งเป็นค่าเริ่มต้น
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      aria-label="แก้ไขที่อยู่"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                      aria-label="ลบที่อยู่"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
