import React, { useMemo } from 'react';
import { Pencil, Trash2, Plus, MapPin, Star } from 'lucide-react';
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
  B: 'ที่อยู่กำกับภาษี',
  S: 'ที่อยู่จัดส่ง',
};

const TYPE_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  B: {
    bg: 'bg-brand-lavender',
    text: 'text-brand-purple',
    border: 'border-brand-purple/20',
    dot: 'bg-brand-purple',
  },
  S: {
    bg: 'bg-brand-lavender',
    text: 'text-brand-purple',
    border: 'border-brand-purple/20',
    dot: 'bg-brand-orange',
  },
};

function rowType(row: Row): 'B' | 'S' {
  const t = mapAddressFromApi(row)?.addressType ?? '';
  if (t === 'S') return 'S';
  return 'B';
}

function displayLocation(row: Row): string {
  const address = mapAddressFromApi(row);
  return address ? formatAddressLocation(address) : '—';
}

export function AddressList({ addresses, onCreate, onEdit, onDelete, onSetDefault }: Props) {
  const grouped = useMemo(() => {
    const map: Record<'B' | 'S', Row[]> = { B: [], S: [] };
    for (const a of addresses) {
      map[rowType(a)].push(a);
    }
    return map;
  }, [addresses]);

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <MapPin size={16} className='text-brand-purple shrink-0' />
          <h3 className='text-sm font-semibold text-gray-800'>รายการที่อยู่</h3>
          {addresses.length > 0 && (
            <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-violet-soft text-brand-purple text-[10px] font-bold'>
              {addresses.length}
            </span>
          )}
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={onCreate}
          className='flex min-w-[126px] items-center justify-center gap-1.5 px-3 py-2 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-brand-violet-deep transition-colors'
        >
          <Plus size={13} />
          เพิ่มที่อยู่
        </Button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 && (
        <div className='flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center'>
          <MapPin size={28} className='text-gray-300 mb-2' />
          <p className='text-sm font-medium text-gray-500'>ยังไม่มีที่อยู่ในระบบ</p>
          <p className='text-xs text-gray-400 mt-1'>กดปุ่ม "เพิ่มที่อยู่" เพื่อเพิ่มที่อยู่ใหม่</p>
        </div>
      )}

      {/* Groups */}
      {(['B', 'S'] as const).map((type) => {
        const color = TYPE_COLOR[type];
        return (
          <div key={type} className='space-y-2.5'>
            {/* Group label */}
            <div className='flex items-center gap-2'>
              <span className={`inline-block w-2 h-2 rounded-full ${color.dot}`} />
              <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                {TYPE_LABEL[type]}
              </p>
              <span className='text-xs text-gray-400'>({grouped[type].length})</span>
            </div>

            {grouped[type].length === 0 ? (
              <p className='text-xs text-gray-400 pl-4'>ไม่มีรายการ</p>
            ) : (
              <div className='space-y-2'>
                {grouped[type].map((row, idx) => {
                  const address = mapAddressFromApi(row);
                  const id = String(address?.id ?? `${type}-${idx}`);
                  const isDefault = Boolean(address?.isDefault);
                  return (
                    <div
                      key={id}
                      className={`rounded-lg border bg-white transition-colors hover:border-brand-purple/20 ${
                        isDefault
                          ? `${color.border} border-l-4 border-l-brand-purple`
                          : 'border-gray-100'
                      }`}
                    >
                      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 py-3.5'>
                        {/* Content */}
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2 mb-1'>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${color.bg} ${color.text} ${color.border} border`}
                            >
                              {TYPE_LABEL[type]}
                            </span>
                            {isDefault && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200'>
                                <Star size={9} className='fill-amber-500 text-amber-500' />
                                ค่าเริ่มต้น
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-line'>
                            {address?.addressDetail || '—'}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>{displayLocation(row)}</p>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-1.5 shrink-0 sm:pt-0.5'>
                          {!isDefault && (
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => onSetDefault(row)}
                              className='px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors'
                            >
                              ตั้งค่าเริ่มต้น
                            </Button>
                          )}
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => onEdit(row)}
                            className='p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-purple/30 hover:text-brand-purple hover:bg-brand-lavender transition-colors'
                            aria-label='แก้ไขที่อยู่'
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => onDelete(row)}
                            className='p-2 rounded-lg border border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors'
                            aria-label='ลบที่อยู่'
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
