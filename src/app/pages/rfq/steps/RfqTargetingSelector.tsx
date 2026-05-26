import React from 'react';
import { Building2, Users, Search, X } from 'lucide-react';
import { factoriesApi } from '@/services/api/factoryApi';
import type { TargetFactory } from '@/pages/rfq/useRFQDraft';

// ─── Factory search hook (debounced) ─────────────────────────────────────────

function useFactorySearch(query: string) {
  const [results, setResults] = React.useState<TargetFactory[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      void factoriesApi
        .search(q)
        .then((raw) => {
          if (!active) return;
          const arr = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? []);
          setResults(
            (arr as Record<string, unknown>[])
              .slice(0, 8)
              .map((f) => ({
                id: Number(f.factory_id ?? f.id ?? 0),
                name: String(f.factory_name ?? f.name ?? ''),
              }))
              .filter((f) => f.id > 0 && f.name),
          );
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 280);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  targeting: 'all' | 'specific';
  targetFactories: TargetFactory[];
  onTargetingChange: (t: 'all' | 'specific') => void;
  onFactoriesChange: (factories: TargetFactory[]) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RfqTargetingSelector({
  targeting,
  targetFactories,
  onTargetingChange,
  onFactoriesChange,
}: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const { results, loading } = useFactorySearch(searchQuery);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addFactory = React.useCallback(
    (f: TargetFactory) => {
      if (targetFactories.some((tf) => tf.id === f.id)) return;
      onFactoriesChange([...targetFactories, f]);
      setSearchQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [targetFactories, onFactoriesChange],
  );

  const removeFactory = React.useCallback(
    (id: number) => onFactoriesChange(targetFactories.filter((f) => f.id !== id)),
    [targetFactories, onFactoriesChange],
  );

  return (
    <div className='space-y-2.5'>
      {/* ── Mode selector ── */}
      {(['all', 'specific'] as const).map((mode) => {
        const active = targeting === mode;
        return (
          <button
            key={mode}
            type='button'
            onClick={() => onTargetingChange(mode)}
            className={`w-full flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-all ${
              active
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 active:scale-[0.99]'
            }`}
          >
            {/* Radio dot */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                active ? 'border-violet-500' : 'border-gray-300'
              }`}
            >
              {active && <div className='h-2.5 w-2.5 rounded-full bg-violet-500' />}
            </div>

            {mode === 'all' ? (
              <Users size={16} className={active ? 'text-violet-500' : 'text-gray-400'} />
            ) : (
              <Building2 size={16} className={active ? 'text-violet-500' : 'text-gray-400'} />
            )}

            <div className='min-w-0'>
              <p
                className={`text-[13px] font-semibold ${active ? 'text-violet-800' : 'text-gray-700'}`}
              >
                {mode === 'all' ? 'ส่งให้ทุกโรงงานที่รับงานประเภทนี้' : 'เลือกโรงงานที่ต้องการ'}
              </p>
              <p className='mt-0.5 text-[11px] text-gray-400'>
                {mode === 'all'
                  ? 'ระบบจับคู่โรงงานที่เหมาะสมโดยอัตโนมัติ'
                  : 'ค้นหาชื่อโรงงานแล้วเพิ่มเข้า list ได้ทีละรายการ'}
              </p>
            </div>
          </button>
        );
      })}

      {/* ── Factory search (specific mode only) ── */}
      {targeting === 'specific' && (
        <div className='pt-1'>
          {/* Selected factory chips */}
          {targetFactories.length > 0 && (
            <div className='mb-2.5 flex flex-wrap gap-2'>
              {targetFactories.map((f) => (
                <span
                  key={f.id}
                  className='flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[12px] font-medium text-violet-800'
                >
                  <Building2 size={11} className='shrink-0' />
                  <span className='max-w-[140px] truncate'>{f.name}</span>
                  <button
                    type='button'
                    onClick={() => removeFactory(f.id)}
                    className='ml-0.5 text-violet-400 transition-colors hover:text-violet-600'
                    aria-label={`ลบ ${f.name}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className='relative'>
            <div className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-all focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400/30'>
              <Search size={14} className='shrink-0 text-gray-400' />
              <input
                ref={inputRef}
                type='text'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder='ค้นหาชื่อโรงงาน…'
                className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400'
              />
              {loading && (
                <span className='inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-violet-400 border-t-transparent' />
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && searchQuery.trim().length >= 2 && (
              <div className='absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg'>
                {results.length === 0 && !loading ? (
                  <p className='px-4 py-3 text-[12px] text-gray-400'>ไม่พบโรงงานที่ค้นหา</p>
                ) : (
                  results.map((f) => {
                    const already = targetFactories.some((tf) => tf.id === f.id);
                    return (
                      <button
                        key={f.id}
                        type='button'
                        disabled={already}
                        onMouseDown={() => addFactory(f)}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                          already
                            ? 'cursor-not-allowed opacity-40'
                            : 'hover:bg-violet-50 active:bg-violet-100'
                        }`}
                      >
                        <Building2 size={14} className='shrink-0 text-gray-400' />
                        <span className='flex-1 text-[13px] text-gray-800'>{f.name}</span>
                        {already && (
                          <span className='text-[10px] text-violet-400'>เพิ่มแล้ว</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Warning when no factories selected */}
          {targetFactories.length === 0 && (
            <p className='mt-2 text-[11px] text-amber-600'>
              ⚠️ ต้องเพิ่มโรงงานอย่างน้อย 1 รายการเพื่อส่ง RFQ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
