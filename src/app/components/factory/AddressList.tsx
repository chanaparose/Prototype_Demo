import React, { useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatAddressLocation,
  mapAddressFromApi,
} from '@/domain/shared/mappers/mapAddressFromApi';

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
  const t = mapAddressFromApi(row)?.addressType ?? '';
  if (t === 'B' || t === 'S') return t;
  return 'M';
}

function displayLocation(row: Row): string {
  const address = mapAddressFromApi(row);
  return address ? formatAddressLocation(address) : '—';
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
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold text-gray-800'>รายการที่อยู่</h3>
        <Button
          variant='unstyled'
          type='button'
          onClick={onCreate}
          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white'
          style={{
            background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-violet) 100%)',
          }}
        >
          <Plus size={14} />
          เพิ่มที่อยู่
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className='text-sm text-gray-400'>ยังไม่มีที่อยู่ในระบบ</p>
      ) : null}

      {(['M', 'B', 'S'] as const).map((type) => (
        <div key={type} className='space-y-2'>
          <p className='text-xs font-semibold text-gray-600'>{TYPE_LABEL[type]}</p>
          {grouped[type].length === 0 ? (
            <p className='text-xs text-gray-400'>ไม่มีรายการ</p>
          ) : (
            grouped[type].map((row, idx) => {
              const address = mapAddressFromApi(row);
              const id = String(address?.id ?? `${type}-${idx}`);
              const isDefault = Boolean(address?.isDefault);
              return (
                <div
                  key={id}
                  className='rounded-xl border border-gray-100 px-3 py-3 bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'
                >
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-sm font-medium text-gray-900'>{TYPE_LABEL[type]}</span>
                      {isDefault ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                          ค่าเริ่มต้น
                        </span>
                      ) : null}
                    </div>
                    <p className='text-sm text-gray-700 mt-1 whitespace-pre-line'>
                      {address?.addressDetail || '—'}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>{displayLocation(row)}</p>
                  </div>
                  <div className='flex items-center gap-1.5 shrink-0'>
                    {!isDefault ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => onSetDefault(row)}
                        className='px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50'
                      >
                        ตั้งเป็นค่าเริ่มต้น
                      </Button>
                    ) : null}
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => onEdit(row)}
                      className='p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50'
                      aria-label='แก้ไขที่อยู่'
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => onDelete(row)}
                      className='p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50'
                      aria-label='ลบที่อยู่'
                    >
                      <Trash2 size={14} />
                    </Button>
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
