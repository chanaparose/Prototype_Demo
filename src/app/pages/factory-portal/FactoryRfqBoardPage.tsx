import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  FileText,
  ChevronDown,
  Check,
  ClipboardList,
  Crosshair,
  EyeOff,
  Mail,
  Send,
} from 'lucide-react';
import { factoryRfqsApi } from '@/services/api/rfqApi';
import { RfqTable } from '@/components/factory/RfqCard';
import { useFactoryRfqBoard, type FactoryBoardRow } from '@/hooks/useFactoryRfqBoard';
import { useDisclosure } from '@/hooks/ui/useDisclosure';
import { useToggle } from '@/hooks/ui/useToggle';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { Button } from '@/components/ui/button';

type BoardTabKey = 'open' | 'quoted' | 'direct';
type KindFilterKey = 'pr' | 'ps' | 'ms' | 'mr';
type DropdownOption = { value: string; label: string };
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(ev.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggle}
        className='w-full h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 text-left hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100'
      >
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[11px] text-slate-500 shrink-0'>{label}</span>
          <span className='flex items-center gap-1.5 min-w-0'>
            <span className='text-xs font-semibold text-slate-700 truncate'>
              {selected?.label ?? '-'}
            </span>
            <ChevronDown
              size={10}
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </Button>
      {isOpen ? (
        <div className='absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-xl border border-slate-200 bg-white shadow-lg p-1 max-h-64 overflow-auto'>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Button
                variant='unstyled'
                key={opt.value || '__empty'}
                type='button'
                onClick={() => {
                  onChange(opt.value);
                  onClose();
                }}
                className='w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-50 transition-colors'
                style={{ background: isSelected ? '#EEF2FF' : 'transparent' }}
              >
                <span
                  className={`text-[12px] ${isSelected ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}
                >
                  {opt.label}
                </span>
                {isSelected ? <Check size={13} className='text-indigo-600' /> : null}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function useNarrowTabs(breakpoint = 400) {
  const { state: narrow, set: setNarrow } = useToggle();
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [breakpoint, setNarrow]);
  return narrow;
}

function tabCounts(rows: FactoryBoardRow[]) {
  const open = rows.filter((r) => !r.hasMyQuote && r.status === 'OP').length;
  const quoted = rows.filter((r) => r.hasMyQuote).length;
  const all = open + quoted;
  const closing = rows.filter(
    (r) =>
      !r.hasMyQuote &&
      r.status === 'OP' &&
      r.daysLeft != null &&
      r.daysLeft >= 0 &&
      r.daysLeft <= 3,
  ).length;
  /** ส่งตรง + ยังไม่เสนอ BOQ — รอการตอบรับไปแท็บ quoted */
  const direct = rows.filter((r) => r.isTargeted && !r.hasMyQuote && r.status === 'OP').length;
  return { all, open, quoted, closing, direct };
}

function isDirectPending(row: FactoryBoardRow): boolean {
  return Boolean(row.isTargeted && !row.hasMyQuote && row.status === 'OP');
}

function matchesKind(row: FactoryBoardRow, kind: KindFilterKey): boolean {
  const k = String(row.requestKind ?? 'PR').toUpperCase();
  if (kind === 'pr') return k === 'PR';
  if (kind === 'ps') return k === 'PS';
  if (kind === 'ms') return k === 'MS';
  return k === 'MR';
}

function applyStatusTab(rows: FactoryBoardRow[], statusTab: BoardTabKey): FactoryBoardRow[] {
  if (statusTab === 'direct') return rows.filter(isDirectPending);
  if (statusTab === 'quoted') return rows.filter((r) => r.hasMyQuote);
  return rows.filter((r) => !r.hasMyQuote && r.status === 'OP');
}

function applyBoardFilter(
  rows: FactoryBoardRow[],
  statusTab: BoardTabKey,
  kindFilter: KindFilterKey | '',
): FactoryBoardRow[] {
  const byStatus = applyStatusTab(rows, statusTab);
  if (!kindFilter) return byStatus;
  return byStatus.filter((r) => matchesKind(r, kindFilter));
}

function applyFilters(
  rows: FactoryBoardRow[],
  q: string,
  catId: string,
  shipId: string,
): FactoryBoardRow[] {
  let out = rows;
  const qq = q.trim().toLowerCase();
  if (qq) {
    out = out.filter(
      (r) =>
        r.title.toLowerCase().includes(qq) ||
        r.id.toLowerCase().includes(qq) ||
        r.categoryName.toLowerCase().includes(qq) ||
        r.subCategoryName.toLowerCase().includes(qq),
    );
  }
  if (catId) {
    const cid = Number(catId);
    out = out.filter((r) => r.categoryId === cid);
  }
  if (shipId) {
    const sid = Number(shipId);
    out = out.filter((r) => r.shippingMethodId === sid);
  }
  return out;
}

function sortRows(rows: FactoryBoardRow[]): FactoryBoardRow[] {
  const copy = [...rows];
  copy.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return copy;
}

export function FactoryRfqBoardPage() {
  const {
    fid,
    rows,
    factoryCategoryIds,
    shipNameById,
    loading,
    error,
    reload,
    dismissedRows,
    dismissedLoading,
    dismissedLoaded,
    loadDismissed,
    reloadDismissed,
  } = useFactoryRfqBoard();
  const narrowTabs = useNarrowTabs(400);
  const navigate = useNavigate();

  const [statusTab, setStatusTab] = useState<BoardTabKey>('open');
  const [kindFilter, setKindFilter] = useState<KindFilterKey | ''>('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterShip, setFilterShip] = useState('');
  const [showDismissed, setShowDismissed] = useState(false);
  const [undismissBusy, setUndismissBusy] = useState<string | null>(null);

  const counts = useMemo(() => tabCounts(rows), [rows]);
  // Kind counts = ยังไม่ได้เสนอ + OP เท่านั้น (ใช้ unansweredByKind แทน kindCounts)
  const unansweredByKind = useMemo(
    () => ({
      pr: rows.filter(
        (r) =>
          !r.hasMyQuote &&
          r.status === 'OP' &&
          String(r.requestKind ?? 'PR').toUpperCase() === 'PR',
      ).length,
      ps: rows.filter(
        (r) =>
          !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? '').toUpperCase() === 'PS',
      ).length,
      ms: rows.filter(
        (r) =>
          !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? '').toUpperCase() === 'MS',
      ).length,
      mr: rows.filter(
        (r) =>
          !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? '').toUpperCase() === 'MR',
      ).length,
    }),
    [rows],
  );
  const summary = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    // นับเฉพาะ OP ที่ยังไม่เสนอ
    const newToday = rows.filter(
      (r) => !r.hasMyQuote && r.status === 'OP' && now - r.createdAtMs <= oneDay,
    ).length;
    const closingSoon = rows.filter(
      (r) =>
        !r.hasMyQuote &&
        r.status === 'OP' &&
        r.daysLeft != null &&
        r.daysLeft >= 0 &&
        r.daysLeft <= 3,
    ).length;
    const waitingQuote = rows.filter((r) => r.hasMyQuote).length;
    return { newToday, closingSoon, waitingQuote };
  }, [rows]);

  const categoryOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of rows) {
      if (r.categoryId > 0 && r.categoryName && !m.has(r.categoryId)) {
        m.set(r.categoryId, r.categoryName);
      }
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'th'));
  }, [rows]);

  const shipOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const r of rows) {
      if (r.shippingMethodId != null && r.shippingMethodId > 0) ids.add(r.shippingMethodId);
    }
    return [...ids]
      .sort((a, b) => a - b)
      .map((id) => ({
        id,
        name: shipNameById.get(id) ?? `#${id}`,
      }));
  }, [rows, shipNameById]);

  const pipeline = useMemo(() => {
    const t = applyBoardFilter(rows, statusTab, kindFilter);
    const f = applyFilters(t, search, filterCat, filterShip);
    return sortRows(f);
  }, [rows, statusTab, kindFilter, search, filterCat, filterShip]);

  const noFactoryCategories = fid != null && factoryCategoryIds.length === 0;
  const hasFilters = search.trim() !== '' || filterCat !== '' || filterShip !== '';

  const clearFilters = () => {
    setSearch('');
    setFilterCat('');
    setFilterShip('');
  };

  const toggleDismissed = () => {
    const next = !showDismissed;
    setShowDismissed(next);
    if (next && !dismissedLoaded) void loadDismissed();
  };

  const handleUndismiss = async (rfqId: string) => {
    setUndismissBusy(rfqId);
    try {
      await factoryRfqsApi.undismiss(rfqId);
      await Promise.all([reload(), reloadDismissed()]);
    } finally {
      setUndismissBusy(null);
    }
  };

  const boqCounts = useMemo(
    () => ({
      pd: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'PD').length,
      ac: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'AC').length,
      rj: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'RJ').length,
    }),
    [rows],
  );

  const tabDefs: {
    key: BoardTabKey;
    label: string;
    shortLabel: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'direct',
      label: 'ส่งตรงถึงคุณ',
      shortLabel: 'ส่งตรง',
      count: counts.direct,
      icon: <Crosshair size={14} className='shrink-0' />,
    },
    {
      key: 'open',
      label: 'รอเสนอราคา',
      shortLabel: 'รอเสนอ',
      count: counts.open,
      icon: <Mail size={14} className='shrink-0' />,
    },
    {
      key: 'quoted',
      label: 'รอการตอบรับ',
      shortLabel: 'รอการตอบรับ',
      count: counts.quoted,
      icon: <Send size={14} className='shrink-0' />,
    },
  ];
  const kindTabs: {
    key: KindFilterKey;
    label: string;
    count: number;
    hint: string;
  }[] = [
    { key: 'pr', label: 'OEM', count: unansweredByKind.pr, hint: 'ขอราคาการผลิต' },
    { key: 'mr', label: 'สั่งวัตถุดิบ', count: unansweredByKind.mr, hint: 'ขอวัตถุดิบ' },
    { key: 'ps', label: 'ตัวอย่างสินค้า', count: unansweredByKind.ps, hint: 'ขอสินค้าทดลอง' },
    { key: 'ms', label: 'ตัวอย่างวัสดุ', count: unansweredByKind.ms, hint: 'ขอวัสดุทดลอง' },
  ];

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader
          title='กระดาน RFQ'
          subtitle='Factory / RFQ'
          icon={FileText}
          count={`${counts.all} รายการ`}
        />
        <div className='flex justify-center items-start pt-8'>
          <div
            className='w-10 h-10 border-3 border-t-transparent rounded-full animate-spin'
            style={{ borderColor: 'var(--brand-indigo)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <FactoryPageHeader
        title='กระดาน RFQ'
        subtitle='Factory / RFQ'
        icon={FileText}
        count={`${counts.all} รายการ`}
      />

      {error ? (
        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
          <ErrorAlert className='flex-1'>{error}</ErrorAlert>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void reload()}
            className='text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-700 shrink-0'
          >
            ลองอีกครั้ง
          </Button>
        </div>
      ) : null}

      {noFactoryCategories ? (
        <div className='rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-5 text-center space-y-3'>
          <p className='text-sm font-semibold text-amber-950'>เลือกหมวดหมู่ที่โรงงานรับผลิตก่อน</p>
          <p className='text-xs text-amber-900/90'>
            กระดานนี้แสดง RFQ ที่ตรงกับหมวดหมู่ของโรงงาน — ตั้งค่าโปรไฟล์เพื่อรับ RFQ ที่เหมาะสม
          </p>
          <Link
            to='/factory/profile'
            className='inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white'
            style={{
              background:
                'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
              boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
            }}
          >
            ไปที่ข้อมูลโรงงาน
          </Link>
        </div>
      ) : null}

      {!noFactoryCategories ? (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {kindTabs.map((k) => {
              const active = kindFilter === k.key;
              const pending = unansweredByKind[k.key];
              return (
                <Button
                  variant='unstyled'
                  key={k.key}
                  type='button'
                  onClick={() => setKindFilter((prev) => (prev === k.key ? '' : k.key))}
                  className={`rounded-2xl border bg-white p-3 text-left transition-colors ${
                    active
                      ? 'border-indigo-400 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className='text-xs text-slate-500'>{k.label}</p>
                  <div className='mt-2 flex items-end justify-between gap-2'>
                    <p className='text-xl font-bold tabular-nums leading-none text-slate-900'>{k.count}</p>
                    <div className='flex min-w-0 items-center gap-1.5'>
                      {pending > 0 ? (
                        <span className='shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600'>
                          {pending}
                        </span>
                      ) : (
                        <span className='shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600'>
                          ครบ
                        </span>
                      )}
                      <span className='truncate text-[11px] text-slate-400'>
                        {pending > 0 ? k.hint : 'ตอบครบแล้ว'}
                      </span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {narrowTabs ? (
            <div className='flex items-center gap-2'>
              <FilterDropdown
                label='ชุดรายการ'
                value={statusTab}
                onChange={(v) => setStatusTab(v as BoardTabKey)}
                options={tabDefs.map((t) => ({ value: t.key, label: `${t.label} (${t.count})` }))}
                className='flex-1'
              />
            </div>
          ) : null}

          <div className='sticky top-14 z-[5] bg-brand-page py-2 -my-1'>
            <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
              {!narrowTabs ? (
                <div
                  className='flex overflow-x-auto overflow-y-hidden border-b border-slate-100 [&::-webkit-scrollbar]:hidden'
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  role='tablist'
                  aria-label='สถานะใบเสนอราคา'
                >
                  {tabDefs.map((t) => {
                    const on = statusTab === t.key;
                    return (
                      <button
                        key={t.key}
                        type='button'
                        role='tab'
                        aria-selected={on}
                        onClick={() => setStatusTab(t.key)}
                        className='flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3.5 text-[13px] -mb-px transition-colors focus:outline-none'
                        style={{
                          borderBottomColor: on ? 'var(--brand-indigo)' : 'transparent',
                          color: on ? 'var(--brand-indigo)' : '#64748b',
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {t.icon}
                        <span className='hidden sm:inline'>{t.label}</span>
                        <span className='sm:hidden'>{t.shortLabel}</span>
                        {t.count > 0 ? (
                          <span
                            className='min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums'
                            style={{
                              background: on ? '#eef2ff' : '#f1f5f9',
                              color: on ? 'var(--brand-indigo)' : '#94a3b8',
                            }}
                          >
                            {t.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className='space-y-2.5 border-b border-slate-100 px-4 py-3 transition-all'>
                <div className='flex gap-2 border-b border-slate-100 pb-2.5 transition-colors'>
                  <div className='relative flex-1'>
                    <Search
                      size={14}
                      className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                    />
                    <input
                      type='search'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder='ค้นหา RFQ, ชื่อสินค้า, เลขอ้างอิง...'
                      className='h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-xs placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:text-[13px]'
                    />
                  </div>
                </div>

                <div className='mt-2 flex items-center gap-2'>
                  <div className='flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible'>
                  <span className='inline-flex items-center gap-1 text-xs text-gray-500 shrink-0 sm:hidden'>
                    <SlidersHorizontal size={14} /> กรอง
                  </span>
                  <FilterDropdown
                    label='หมวดหมู่'
                    value={filterCat}
                    onChange={setFilterCat}
                    options={[
                      { value: '', label: 'หมวดหมู่ทั้งหมด' },
                      ...categoryOptions.map(([cid, name]) => ({ value: String(cid), label: name })),
                    ]}
                    className='shrink-0 min-w-[11rem]'
                  />
                  <FilterDropdown
                    label='วิธีจัดส่ง'
                    value={filterShip}
                    onChange={setFilterShip}
                    options={[
                      { value: '', label: 'วิธีส่งทั้งหมด' },
                      ...shipOptions.map((s) => ({ value: String(s.id), label: s.name })),
                    ]}
                    className='shrink-0 min-w-[11rem]'
                  />
                  {hasFilters ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={clearFilters}
                      className='shrink-0 px-3 py-2 rounded-full text-xs font-semibold border'
                      style={{
                        borderColor: 'var(--brand-indigo)',
                        color: 'var(--brand-indigo)',
                        backgroundColor: '#F3E8FF',
                      }}
                    >
                      ล้างตัวกรอง ✕
                    </Button>
                  ) : null}
                  </div>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={toggleDismissed}
                    className='flex shrink-0 items-center gap-1 py-0.5 text-[11px] text-slate-400 hover:text-slate-600'
                  >
                    <EyeOff size={11} />
                    {showDismissed ? 'ซ่อน RFQ ที่ข้ามไปแล้ว' : 'ดู RFQ ที่ข้ามไปแล้ว'}
                  </Button>
                </div>

                {hasFilters ? (
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {search.trim() ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => setSearch('')}
                        className='rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600'
                      >
                        คำค้น: {search.trim()} ✕
                      </Button>
                    ) : null}
                    {filterCat ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => setFilterCat('')}
                        className='rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600'
                      >
                        หมวดหมู่ ✕
                      </Button>
                    ) : null}
                    {filterShip ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => setFilterShip('')}
                        className='rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600'
                      >
                        วิธีจัดส่ง ✕
                      </Button>
                    ) : null}
                  </div>
                ) : null}

              {showDismissed ? (
                <div className='mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <EyeOff size={14} className='text-slate-400' />
                    <p className='text-[12px] font-semibold text-slate-500 uppercase tracking-wide'>
                      RFQ ที่ข้ามไปแล้ว
                    </p>
                  </div>
                  {dismissedLoading ? (
                    <div className='flex justify-center py-4'>
                      <div className='w-6 h-6 border-2 border-t-transparent border-slate-300 rounded-full animate-spin' />
                    </div>
                  ) : dismissedRows.length === 0 ? (
                    <p className='text-xs text-slate-400 text-center py-3'>ไม่มี RFQ ที่ถูกข้ามไป</p>
                  ) : (
                    <ul className='space-y-2'>
                      {dismissedRows.map((r) => (
                        <li
                          key={r.id}
                          className='flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5'
                        >
                          <button
                            type='button'
                            onClick={() => navigate(`/factory/rfqs/${r.id}`)}
                            className='flex-1 min-w-0 text-left'
                          >
                            <p className='text-[13px] font-semibold text-slate-700 truncate'>
                              {r.title}
                            </p>
                            <p className='text-[11px] text-slate-400'>
                              #{r.id}
                              {r.categoryName ? ` · ${r.categoryName}` : ''}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {pipeline.length === 0 ? (
                <div className='mt-3 rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4'>
                  <div className='text-5xl'>🔍</div>
                  <p className='text-base font-bold' style={{ color: 'var(--brand-navy)' }}>
                    {statusTab === 'direct'
                      ? 'ยังไม่มี RFQ ที่ส่งถึงคุณโดยตรง'
                      : rows.length === 0
                        ? 'ยังไม่มี RFQ ที่ตรงกับหมวดหมู่โรงงานของคุณ'
                        : 'ไม่พบ RFQ ตามเงื่อนไข'}
                  </p>
                  <p className='text-sm text-gray-400'>
                    {statusTab === 'direct'
                      ? 'ลูกค้าเลือกส่งคำขอมาที่โรงงานของคุณโดยเฉพาะ — รายการจะปรากฏที่นี่'
                      : rows.length === 0
                        ? 'ระบบจะแสดงรายการใหม่ที่ตรงกับหมวดหมู่ทันทีเมื่อมี RFQ เข้า'
                        : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'}
                  </p>
                  {hasFilters ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={clearFilters}
                      className='inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white'
                      style={{
                        background:
                          'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                        boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                      }}
                    >
                      ล้างตัวกรอง
                    </Button>
                  ) : rows.length === 0 ? (
                    <Link
                      to='/factory/profile'
                      className='inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white'
                      style={{
                        background:
                          'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                        boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
                      }}
                    >
                      ปรับหมวดหมู่ในโปรไฟล์
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className='-mx-3 sm:-mx-4 mt-3 border-t border-slate-100'>
                  <RfqTable
                    rows={pipeline}
                    variant={statusTab === 'quoted' ? 'boq' : 'board'}
                    pageSize={7}
                    seamless
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
