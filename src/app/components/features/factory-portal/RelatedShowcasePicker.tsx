import React from 'react';
import { showcasesApi } from '@/services/api';
import { normShowcase } from '@/hooks/useShowcases';
import type { FactoryShowcase } from '@/stores';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RelatedShowcasePickerProps {
  factoryId: number;
  value: number[];
  onChange: (next: number[]) => void;
  max?: number;
  disabled?: boolean;
  errorText?: string;
}

export function RelatedShowcasePicker({
  factoryId,
  value,
  onChange,
  max = 5,
  disabled = false,
  errorText = '',
}: RelatedShowcasePickerProps) {
  const [items, setItems] = React.useState<FactoryShowcase[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'product' | 'promotion'>('all');
  const [draft, setDraft] = React.useState<number[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void showcasesApi
      .listByFactory(factoryId)
      .then((rows) => {
        if (cancelled) return;
        const list = (Array.isArray(rows) ? rows : [])
          .map((r) => normShowcase((r ?? {}) as Record<string, unknown>))
          .filter((s) => s.contentType === 'product' || s.contentType === 'promotion');
        setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [factoryId]);

  const selected = React.useMemo(() => {
    const set = new Set<number>();
    for (const id of value) {
      const n = Number(id);
      if (Number.isFinite(n) && n > 0) set.add(n);
    }
    return set;
  }, [value]);

  const atLimit = selected.size >= max;

  React.useEffect(() => {
    if (!open) return;
    setDraft([...selected]);
  }, [open, selected]);

  const draftSet = React.useMemo(() => new Set(draft), [draft]);
  const draftAtLimit = draftSet.size >= max;

  const toggleDraft = (id: string) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return;
    const has = draftSet.has(n);
    if (!has && draftAtLimit) return;
    const next = has ? [...draftSet].filter((x) => x !== n) : [...draftSet, n];
    setDraft(next.slice(0, max));
  };

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
      if (!q) return true;
      const title = String(item.title ?? '').toLowerCase();
      const cat = String(item.category ?? '').toLowerCase();
      const sub = String(item.sub_category_name ?? '').toLowerCase();
      return title.includes(q) || cat.includes(q) || sub.includes(q);
    });
  }, [items, search, typeFilter]);

  const apply = () => {
    if (disabled) return;
    onChange([...draftSet].slice(0, max));
    setOpen(false);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs text-gray-500'>
          เลือกแล้ว {selected.size}/{max}
        </p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => setOpen(true)}
          disabled={disabled}
          className='inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60'
        >
          <Plus size={14} />
          เพิ่มสินค้าอ้างอิง
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {items
            .filter((item) => selected.has(Number(item.id)))
            .map((item) => (
              <div
                key={item.id}
                className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2'
              >
                <div className='w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0'>
                  {item.image ? (
                    <img src={item.image} alt='' className='w-full h-full object-cover' />
                  ) : null}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-semibold text-gray-800 line-clamp-1'>{item.title}</p>
                  <p className='text-[11px] text-gray-500 line-clamp-1'>{item.category || '-'}</p>
                </div>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => {
                    const n = Number(item.id);
                    if (!Number.isFinite(n)) return;
                    onChange([...selected].filter((x) => x !== n));
                  }}
                  className='w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center'
                  aria-label='ลบรายการอ้างอิง'
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
        </div>
      ) : null}

      {errorText ? <p className='text-xs text-red-600'>{errorText}</p> : null}

      {open ? (
        <div className='fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4'>
          <div className='w-full max-w-3xl rounded-2xl border border-gray-100 bg-white shadow-xl max-h-[85vh] flex flex-col'>
            <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3'>
              <div>
                <p className='text-sm font-bold text-[#2E2252]'>เลือกสินค้า/โปรโมชันอ้างอิง</p>
                <p className='text-xs text-gray-500'>เลือกได้สูงสุด {max} รายการ</p>
              </div>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setOpen(false)}
                aria-label='ปิด'
                className='w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center'
              >
                <X size={16} />
              </Button>
            </div>

            <div className='p-4 border-b border-gray-100 space-y-2'>
              <div className='relative'>
                <Search
                  size={14}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='ค้นหาชื่อสินค้า / หมวดหมู่'
                  className='w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-violet-300 focus:ring-1 focus:ring-violet-300 outline-none'
                />
              </div>
              <div className='flex items-center gap-2'>
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'product', label: 'สินค้า' },
                  { id: 'promotion', label: 'โปรโมชัน' },
                ].map((t) => {
                  const active = typeFilter === t.id;
                  return (
                    <Button
                      variant='unstyled'
                      key={t.id}
                      type='button'
                      onClick={() => setTypeFilter(t.id as 'all' | 'product' | 'promotion')}
                      className='px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors'
                      style={{
                        borderColor: active ? 'rgba(122,75,148,0.35)' : 'rgba(17,24,39,0.10)',
                        background: active ? 'rgba(122,75,148,0.08)' : '#fff',
                        color: active ? '#7A4B94' : '#4B5563',
                      }}
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className='p-4 overflow-y-auto flex-1'>
              {filteredItems.length === 0 ? (
                <div className='rounded-xl border border-gray-100 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500'>
                  ไม่พบรายการที่ตรงกับคำค้นหา
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {filteredItems.map((item) => {
                    const checked = draftSet.has(Number(item.id));
                    const disableThis = !checked && draftAtLimit;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                          checked ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white'
                        } ${disableThis ? 'opacity-60' : 'cursor-pointer hover:border-violet-200'}`}
                      >
                        <input
                          type='checkbox'
                          checked={checked}
                          disabled={disableThis}
                          onChange={() => toggleDraft(item.id)}
                          className='h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400'
                        />
                        <div className='w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0'>
                          {item.image ? (
                            <img src={item.image} alt='' className='w-full h-full object-cover' />
                          ) : null}
                        </div>
                        <div className='min-w-0'>
                          <p className='text-xs font-semibold text-gray-800 line-clamp-1'>
                            {item.title}
                          </p>
                          <p className='text-[11px] text-gray-500 line-clamp-1'>
                            {item.category || '-'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className='px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2'>
              <p className='text-xs text-gray-500'>
                เลือกแล้ว {draftSet.size}/{max}
              </p>
              <div className='flex items-center gap-2'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setOpen(false)}
                  className='px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600'
                >
                  ยกเลิก
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={apply}
                  disabled={disabled}
                  className='px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60'
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                  }}
                >
                  ยืนยันรายการอ้างอิง
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { RelatedShowcasePickerProps };
