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
                active ? 'border-brand-violet-deep' : 'border-gray-300'
              }`}
            >
              {active && <div className='h-2.5 w-2.5 rounded-full bg-brand-violet-deep' />}
            </div>

            {mode === 'all' ? (
              <Users size={16} className={active ? 'text-brand-violet-deep' : 'text-gray-400'} />
            ) : (
              <Building2 size={16} className={active ? 'text-brand-violet-deep' : 'text-gray-400'} />
            )}

            <div className='min-w-0'>
              <p
                className={`text-[13px] font-semibold xl:text-[15px] ${active ? 'text-brand-violet-deep' : 'text-gray-700'}`}
              >
                {mode === 'all' ? 'ส่งให้ทุกโรงงานที่รับงานประเภทนี้' : 'เลือกโรงงานที่ต้องการ'}
              </p>
              <p className='mt-0.5 text-[11px] text-gray-400 xl:text-[12px] 2xl:text-[13px]'>
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
                  className='flex items-center gap-1.5 rounded-full border border-brand-violet-soft bg-brand-lavender-chip px-2.5 py-1 text-[12px] font-medium text-brand-violet-deep xl:text-[13px]'
                >
                  <Building2 size={11} className='shrink-0' />
                  <span className='max-w-[140px] truncate'>{f.name}</span>
                  <button
                    type='button'
                    onClick={() => removeFactory(f.id)}
                    className='ml-0.5 text-brand-purple/55 transition-colors hover:text-brand-violet-deep'
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
              className={`flex items-center gap-2 bg-white px-3 py-2.5 transition-all focus-within:border-brand-violet-deep focus-within:ring-1 focus-within:ring-brand-purple/20 ${RFQ_RADIUS} ${RFQ_BORDER}`}
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
                className='flex-1 bg-transparent text-[13px] font-normal outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-gray-400 xl:text-[15px] xl:placeholder:text-[15px]'
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
                  <p className='px-4 py-3 text-[12px] text-gray-400 xl:text-sm'>ไม่พบโรงงานที่ค้นหา</p>
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
                            : 'hover:bg-brand-violet-soft/60 active:bg-brand-violet-soft'
                        }`}
                      >
                        <Building2 size={14} className='shrink-0 text-gray-400' />
                        <span className='flex-1 text-[13px] text-gray-800 xl:text-sm'>{f.name}</span>
                        {already && (
                          <span className='text-[10px] text-brand-purple/60 xl:text-[11px]'>เพิ่มแล้ว</span>
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
            <p className='mt-2 flex items-center gap-1 text-[11px] text-amber-600 xl:text-[12px]'>
              <AlertTriangle size={12} />
              ต้องเพิ่มโรงงานอย่างน้อย 1 รายการเพื่อส่ง RFQ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
