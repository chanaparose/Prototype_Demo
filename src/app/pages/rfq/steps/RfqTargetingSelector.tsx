import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Building2, Users, Search, X } from 'lucide-react';
import type { TargetFactory } from '@/pages/rfq/useRFQDraft';
import { RFQ_BORDER, RFQ_RADIUS, rfqChoiceClass } from '@/pages/rfq/rfqCreateWizardUi';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  targeting: 'all' | 'specific';
  targetFactories: TargetFactory[];
  /** Full factory list loaded once on page mount — used for client-side filtering. */
  allFactories: TargetFactory[];
  onTargetingChange: (t: 'all' | 'specific') => void;
  onFactoriesChange: (factories: TargetFactory[]) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RfqTargetingSelector({
  targeting,
  targetFactories,
  allFactories,
  onTargetingChange,
  onFactoriesChange,
}: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Client-side filter — instant, no debounce needed.
  const results = React.useMemo<TargetFactory[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return allFactories
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, allFactories]);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = React.useState<DOMRect | null>(null);

  // Recompute position whenever the dropdown opens or window scrolls/resizes.
  React.useEffect(() => {
    if (!showDropdown || !anchorRef.current) {
      setDropdownRect(null);
      return;
    }
    const update = () => {
      if (anchorRef.current) setDropdownRect(anchorRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showDropdown]);

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
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left active:scale-[0.99] ${rfqChoiceClass(
              active,
            )} ${!active ? 'bg-gray-50/50' : ''}`}
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
          <div ref={anchorRef}>
            <div
              className={`flex items-center gap-2 bg-white px-3 py-2.5 transition-all focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400/30 ${RFQ_RADIUS} ${RFQ_BORDER}`}
            >
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
                className='flex-1 bg-transparent text-[13px] font-normal outline-none placeholder:text-xs placeholder:font-normal placeholder:text-gray-400'
              />
            </div>
          </div>

          {/* Dropdown — rendered via portal to escape overflow:hidden ancestors */}
          {showDropdown && searchQuery.trim().length >= 1 && dropdownRect &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: dropdownRect.bottom + 4,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                  zIndex: 9999,
                }}
                className={`overflow-hidden bg-white shadow-lg ${RFQ_RADIUS} border-[0.5px] border-gray-100`}
              >
                {results.length === 0 ? (
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
              </div>,
              document.body,
            )
          }

          {/* Warning when no factories selected */}
          {targetFactories.length === 0 && (
            <p className='mt-2 flex items-center gap-1 text-[11px] text-amber-600'>
              <AlertTriangle size={12} />
              ต้องเพิ่มโรงงานอย่างน้อย 1 รายการเพื่อส่ง RFQ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
