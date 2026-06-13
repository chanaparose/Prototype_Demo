import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  SlidersHorizontal,
  FileText,
  ClipboardList,
  Crosshair,
  EyeOff,
  Mail,
  Send,
  SearchX,
} from 'lucide-react';
import { factoryRfqsApi } from '@/services/api/rfqApi';
import { RfqTable } from '@/components/factory/RfqCard';
import { useFactoryRfqBoard, type FactoryBoardRow } from '@/hooks/useFactoryRfqBoard';
import { useToggle } from '@/hooks/ui/useToggle';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import {
  FactoryMetricCard,
  FactoryMetricGrid,
} from '@/pages/factory-portal/components/FactoryMetricCards';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { FactoryWorklistCard } from '@/pages/factory-portal/components/FactoryWorklistCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { factoryButtonClass, factoryCardClass } from '@/pages/factory-portal/factoryUi';

type BoardTabKey = 'open' | 'quoted' | 'direct';
type KindFilterKey = 'pr' | 'ps' | 'ms' | 'mr';
type DropdownOption = { value: string; label: string };
const EMPTY_SELECT_VALUE = '__all';

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
  return (
    <div className={className}>
      <Select
        value={value || EMPTY_SELECT_VALUE}
        onValueChange={(next) => onChange(next === EMPTY_SELECT_VALUE ? '' : next)}
      >
        <SelectTrigger className='h-9 w-full text-slate-700'>
          <span className='shrink-0 text-[10px] text-slate-500'>{label}</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value || EMPTY_SELECT_VALUE}
              value={opt.value || EMPTY_SELECT_VALUE}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
            style={{ borderColor: 'var(--brand-purple)', borderTopColor: 'transparent' }}
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
            className={factoryButtonClass({
              variant: 'secondary',
              size: 'md',
              className: 'shrink-0 border-red-200 text-red-700 hover:bg-red-50',
            })}
          >
            ลองอีกครั้ง
          </Button>
        </div>
      ) : null}

      {noFactoryCategories ? (
        <div
          className={factoryCardClass({
            variant: 'section',
            className: 'space-y-3 border-amber-200 bg-amber-50/80 text-center',
          })}
        >
          <p className='text-sm font-semibold text-amber-950'>เลือกหมวดหมู่ที่โรงงานรับผลิตก่อน</p>
          <p className='text-xs text-amber-900/90'>
            กระดานนี้แสดง RFQ ที่ตรงกับหมวดหมู่ของโรงงาน — ตั้งค่าโปรไฟล์เพื่อรับ RFQ ที่เหมาะสม
          </p>
          <Link
            to='/factory/profile'
            className={factoryButtonClass({
              variant: 'primary',
              size: 'md',
              className: 'px-4',
            })}
          >
            ไปที่ข้อมูลโรงงาน
          </Link>
        </div>
      ) : null}

      {!noFactoryCategories ? (
        <>
          <FactoryMetricGrid>
            {kindTabs.map((k) => {
              const pending = unansweredByKind[k.key];
              return (
                <FactoryMetricCard
                  key={k.key}
                  label={k.label}
                  value={k.count}
                  badge={pending > 0 ? pending : 'ครบ'}
                  badgeClassName={
                    pending > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }
                  caption={pending > 0 ? k.hint : 'ตอบครบแล้ว'}
                  onClick={() => setKindFilter((prev) => (prev === k.key ? '' : k.key))}
                />
              );
            })}
          </FactoryMetricGrid>

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

          <FactoryWorklistCard
            tabs={
              narrowTabs
                ? undefined
                : tabDefs.map((t) => ({
                    key: t.key,
                    label: t.label,
                    shortLabel: t.shortLabel,
                    icon: t.icon,
                    count: t.count,
                  }))
            }
            activeTab={statusTab}
            onTabChange={(key) => setStatusTab(key as BoardTabKey)}
            tabAriaLabel='สถานะใบเสนอราคา'
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder='ค้นหา RFQ, ชื่อสินค้า, เลขอ้างอิง...'
            filters={
              <div className='flex items-center gap-2'>
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
                      ...categoryOptions.map(([cid, name]) => ({
                        value: String(cid),
                        label: name,
                      })),
                    ]}
                    className='shrink-0 min-w-[9rem]'
                  />
                  <FilterDropdown
                    label='วิธีจัดส่ง'
                    value={filterShip}
                    onChange={setFilterShip}
                    options={[
                      { value: '', label: 'วิธีส่งทั้งหมด' },
                      ...shipOptions.map((s) => ({ value: String(s.id), label: s.name })),
                    ]}
                    className='shrink-0 min-w-[9rem]'
                  />
                  {hasFilters ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={clearFilters}
                      className={factoryButtonClass({
                        variant: 'secondary',
                        size: 'sm',
                        className:
                          'shrink-0 rounded-full border-brand-purple bg-brand-lavender text-brand-purple hover:bg-brand-lavender',
                      })}
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
            }
            activeFilters={
              hasFilters ? (
                <div className='flex flex-wrap gap-2'>
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
              ) : null
            }
          >
            {showDismissed ? (
              <div className='mt-3 rounded-lg border border-slate-200 bg-[var(--brand-page)]/60 p-4 space-y-3'>
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
                        className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5'
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
              <div className='mt-3 rounded-lg border border-gray-100 bg-white px-4 py-12 text-center space-y-4'>
                <SearchX size={44} className='mx-auto text-slate-400' />
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
                    className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white'
                    style={{
                      background: 'var(--brand-purple)',
                    }}
                  >
                    ล้างตัวกรอง
                  </Button>
                ) : rows.length === 0 ? (
                  <Link
                    to='/factory/profile'
                    className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white'
                    style={{
                      background: 'var(--brand-purple)',
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
          </FactoryWorklistCard>
        </>
      ) : null}
    </div>
  );
}
