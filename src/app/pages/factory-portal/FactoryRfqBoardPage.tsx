import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  FileText,
  Factory,
  PackageSearch,
  FlaskConical,
  ChevronDown,
  Check,
  ClipboardList,
} from 'lucide-react';
import { RfqCard, type RfqCardModel } from '@/components/factory/RfqCard';
import { useFactoryRfqBoard, type FactoryBoardRow } from '@/hooks/useFactoryRfqBoard';
import { useDisclosure, useToggle } from '@/hooks/ui';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabKey = 'all' | 'open' | 'quoted' | 'closing' | 'pr' | 'ps' | 'ms';
type SortKey = 'new' | 'deadline' | 'budget' | 'qty';

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
        className='w-full h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 text-left shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100'
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
  return { all, open, quoted, closing };
}

function applyTab(rows: FactoryBoardRow[], tab: TabKey): FactoryBoardRow[] {
  // "ทั้งหมด" = ยังไม่เสนอ (OP) + เสนอแล้ว (non-AC) → hook กรอง AC ออกแล้ว
  if (tab === 'all') return rows;
  // ยังไม่เสนอ: เฉพาะ OP ที่ไม่มีการส่ง quotation
  if (tab === 'open') return rows.filter((r) => !r.hasMyQuote && r.status === 'OP');

  if (tab === 'quoted') return rows.filter((r) => r.hasMyQuote);

  if (tab === 'pr')
    return rows.filter(
      (r) =>
        !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? 'PR').toUpperCase() === 'PR',
    );
  if (tab === 'ps')
    return rows.filter(
      (r) =>
        !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? '').toUpperCase() === 'PS',
    );
  if (tab === 'ms')
    return rows.filter(
      (r) =>
        !r.hasMyQuote && r.status === 'OP' && String(r.requestKind ?? '').toUpperCase() === 'MS',
    );
  return rows.filter(
    (r) =>
      !r.hasMyQuote &&
      r.status === 'OP' &&
      r.daysLeft != null &&
      r.daysLeft >= 0 &&
      r.daysLeft <= 3,
  );
}

function applyFilters(
  rows: FactoryBoardRow[],
  q: string,
  catId: string,
  rfqSt: string,
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
  if (rfqSt) {
    out = out.filter((r) => r.status === rfqSt);
  }
  if (shipId) {
    const sid = Number(shipId);
    out = out.filter((r) => r.shippingMethodId === sid);
  }
  return out;
}

function sortRows(rows: FactoryBoardRow[], sort: SortKey): FactoryBoardRow[] {
  const copy = [...rows];
  if (sort === 'new') {
    copy.sort((a, b) => b.createdAtMs - a.createdAtMs);
  } else if (sort === 'deadline') {
    copy.sort((a, b) => {
      const da = a.daysLeft;
      const db = b.daysLeft;
      if (da == null && db == null) return b.createdAtMs - a.createdAtMs;
      if (da == null) return 1;
      if (db == null) return -1;
      if (da !== db) return da - db;
      return b.createdAtMs - a.createdAtMs;
    });
  } else if (sort === 'budget') {
    copy.sort((a, b) => (b.budgetPerPiece ?? 0) - (a.budgetPerPiece ?? 0));
  } else {
    copy.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
  }
  return copy;
}

export function FactoryRfqBoardPage() {
  const { fid, rows, factoryCategoryIds, shipNameById, loading, error, reload } =
    useFactoryRfqBoard();
  const narrowTabs = useNarrowTabs(400);

  const [tab, setTab] = useState<TabKey>('open');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterRfqStatus, setFilterRfqStatus] = useState('');
  const [filterShip, setFilterShip] = useState('');
  const [sort, setSort] = useState<SortKey>('new');

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
    const t = applyTab(rows, tab);
    const f = applyFilters(t, search, filterCat, filterRfqStatus, filterShip);
    return sortRows(f, sort);
  }, [rows, tab, search, filterCat, filterRfqStatus, filterShip, sort]);

  const noFactoryCategories = fid != null && factoryCategoryIds.length === 0;
  const hasFilters =
    search.trim() !== '' || filterCat !== '' || filterRfqStatus !== '' || filterShip !== '';

  const clearFilters = () => {
    setSearch('');
    setFilterCat('');
    setFilterRfqStatus('');
    setFilterShip('');
  };

  const boqCounts = useMemo(
    () => ({
      pd: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'PD').length,
      ac: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'AC').length,
      rj: rows.filter((r) => r.hasMyQuote && r.myQuoteStatus === 'RJ').length,
    }),
    [rows],
  );

  const tabDefs: { key: TabKey; label: string; count: number; warn?: boolean }[] = [
    { key: 'open', label: 'ยังไม่ได้เสนอ', count: counts.open },
    { key: 'quoted', label: 'ติดตาม BOQ ที่เสนอ', count: counts.quoted },
    { key: 'all', label: 'ทั้งหมด', count: counts.all },
  ];
  const kindTabs: {
    key: Extract<TabKey, 'pr' | 'ps' | 'ms'>;
    label: string;
    count: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    hint: string;
  }[] = [
    { key: 'pr', label: 'OEM', count: unansweredByKind.pr, icon: Factory, hint: 'ขอราคาการผลิต' },
    {
      key: 'ps',
      label: 'ตัวอย่างสินค้า',
      count: unansweredByKind.ps,
      icon: PackageSearch,
      hint: 'ขอสินค้าทดลอง',
    },
    {
      key: 'ms',
      label: 'ตัวอย่างวัสดุ',
      count: unansweredByKind.ms,
      icon: FlaskConical,
      hint: 'ขอวัสดุทดลอง',
    },
  ];

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader
          title='กระดาน RFQ'
          subtitle='Factory / RFQ'
          icon={FileText}
          count={`${counts.all} รายการ`}
          action={{ label: 'ดูใบเสนอราคา', to: '/factory/quotations' }}
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
        action={{ label: 'ดูใบเสนอราคา', to: '/factory/quotations' }}
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
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
            {kindTabs.map((k) => {
              const active = tab === k.key;
              const pending = unansweredByKind[k.key];
              return (
                <Button
                  variant='unstyled'
                  key={k.key}
                  type='button'
                  onClick={() => setTab(k.key)}
                  className='rounded-2xl border px-3 py-2.5 text-left transition-all'
                  style={{
                    borderColor: active ? 'var(--brand-indigo)' : 'var(--neutral-border)',
                    background: active ? '#EEF2FF' : 'var(--neutral-white)',
                    boxShadow: active ? '0 2px 10px rgba(79,70,229,0.12)' : 'none',
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100'>
                        <k.icon
                          size={15}
                          className={active ? 'text-indigo-600' : 'text-slate-500'}
                        />
                      </span>
                      <div>
                        <p className='text-[13px] font-semibold text-slate-900 leading-none'>
                          {k.label}
                        </p>
                        <p className='text-[11px] text-slate-500 mt-1'>{k.hint}</p>
                        <p
                          className={`text-[11px] mt-1 font-medium ${pending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                        >
                          {pending > 0 ? `ยังไม่ตอบ ${pending}/${k.count}` : 'ตอบครบแล้ว'}
                        </p>
                      </div>
                    </div>
                    <span
                      className='text-xs font-bold rounded-full px-2 py-0.5'
                      style={{
                        background: active ? 'var(--brand-indigo)' : '#EEF2FF',
                        color: active ? 'var(--neutral-white)' : 'var(--brand-indigo)',
                      }}
                    >
                      {k.count}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>

          {narrowTabs ? (
            <div className='flex items-center gap-2'>
              <FilterDropdown
                label='ชุดรายการ'
                value={tab}
                onChange={(v) => setTab(v as TabKey)}
                options={tabDefs.map((t) => ({ value: t.key, label: `${t.label} (${t.count})` }))}
                className='flex-1'
              />
            </div>
          ) : (
            <div
              className='flex items-center gap-1 p-1 rounded-2xl bg-white border border-gray-100 shadow-sm'
              role='tablist'
              aria-label='สถานะใบเสนอราคา'
            >
              {tabDefs.map((t) => {
                const on = tab === t.key;
                return (
                  <Button
                    variant='unstyled'
                    key={t.key}
                    type='button'
                    role='tab'
                    aria-selected={on as boolean}
                    onClick={() => setTab(t.key)}
                    className='flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all'
                    style={{
                      backgroundColor: on ? 'var(--brand-indigo)' : 'transparent',
                      color: on ? 'var(--neutral-white)' : '#334155',
                      fontWeight: on ? 700 : 500,
                      boxShadow: on ? '0 2px 8px rgba(227,136,68,0.35)' : 'none',
                    }}
                  >
                    {t.label}
                    <span className='text-[11px] opacity-80'>({t.count})</span>
                    {t.warn && t.key === 'closing' ? ' ⚠' : ''}
                  </Button>
                );
              })}
            </div>
          )}

          <div className='sticky top-14 z-[5] bg-brand-page py-2 -my-1'>
            <div className='flex flex-col sm:flex-row gap-2'>
              <div className='relative flex-1'>
                <Search
                  className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                  size={16}
                />
                <Input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='ค้นหา ชื่อ / เลข RFQ'
                  className='w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-indigo- bg-white'
                />
              </div>
              <FilterDropdown
                label='เรียงลำดับ'
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                options={[
                  { value: 'new', label: 'ใหม่ล่าสุด' },
                  { value: 'deadline', label: 'ใกล้ปิด' },
                  { value: 'budget', label: 'งบสูงสุด' },
                  { value: 'qty', label: 'จำนวนมากสุด' },
                ]}
                className='sm:min-w-[11rem]'
              />
            </div>

            <div className='mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible'>
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
                label='สถานะ RFQ'
                value={filterRfqStatus}
                onChange={setFilterRfqStatus}
                options={[
                  { value: '', label: 'สถานะ RFQ ทั้งหมด' },
                  { value: 'OP', label: 'เปิดรับ (OP)' },
                  { value: 'CL', label: 'ปิดแล้ว (CL)' },
                  { value: 'CC', label: 'ยกเลิก (CC)' },
                ]}
                className='shrink-0 min-w-[10rem]'
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
                {filterRfqStatus ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setFilterRfqStatus('')}
                    className='rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600'
                  >
                    สถานะ RFQ ✕
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
          </div>

          {pipeline.length === 0 ? (
            <div className='rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4'>
              <div className='text-5xl'>🔍</div>
              <p className='text-base font-bold' style={{ color: 'var(--brand-navy)' }}>
                {rows.length === 0
                  ? 'ยังไม่มี RFQ ที่ตรงกับหมวดหมู่โรงงานของคุณ'
                  : 'ไม่พบ RFQ ตามเงื่อนไข'}
              </p>
              <p className='text-sm text-gray-400'>
                {rows.length === 0
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
            <ul className='space-y-3'>
              {pipeline.map((r) => (
                <li
                  key={r.id}
                  className='rounded-2xl border border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden'
                >
                  <RfqCard row={r as RfqCardModel} variant={tab === 'quoted' ? 'boq' : 'board'} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
