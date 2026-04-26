import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, SlidersHorizontal, FileText } from 'lucide-react';
import { RfqCard, type RfqCardModel } from '../../components/factory/RfqCard';
import { useFactoryRfqBoard, type FactoryBoardRow } from '../../hooks/useFactoryRfqBoard';

type TabKey = 'all' | 'open' | 'quoted' | 'closing';
type SortKey = 'new' | 'deadline' | 'budget' | 'qty';

function useNarrowTabs(breakpoint = 400) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [breakpoint]);
  return narrow;
}

function tabCounts(rows: FactoryBoardRow[]) {
  const all = rows.length;
  const open = rows.filter((r) => !r.hasMyQuote).length;
  const quoted = rows.filter((r) => r.hasMyQuote).length;
  const closing = rows.filter(
    (r) => !r.hasMyQuote && r.daysLeft != null && r.daysLeft >= 0 && r.daysLeft <= 3,
  ).length;
  return { all, open, quoted, closing };
}

function applyTab(rows: FactoryBoardRow[], tab: TabKey): FactoryBoardRow[] {
  if (tab === 'all') return rows;
  if (tab === 'open') return rows.filter((r) => !r.hasMyQuote);
  if (tab === 'quoted') return rows.filter((r) => r.hasMyQuote);
  return rows.filter(
    (r) => !r.hasMyQuote && r.daysLeft != null && r.daysLeft >= 0 && r.daysLeft <= 3,
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
  const { fid, rows, factoryCategoryIds, shipNameById, loading, error, reload } = useFactoryRfqBoard();
  const narrowTabs = useNarrowTabs(400);

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterRfqStatus, setFilterRfqStatus] = useState('');
  const [filterShip, setFilterShip] = useState('');
  const [sort, setSort] = useState<SortKey>('new');

  const counts = useMemo(() => tabCounts(rows), [rows]);

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
    return [...ids].sort((a, b) => a - b).map((id) => ({
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

  const tabDefs: { key: TabKey; label: string; count: number; warn?: boolean }[] = [
    { key: 'all', label: 'ทั้งหมด', count: counts.all },
    { key: 'open', label: 'ยังไม่ได้เสนอ', count: counts.open },
    { key: 'quoted', label: 'เสนอแล้ว', count: counts.quoted },
    { key: 'closing', label: 'ใกล้ปิด', count: counts.closing, warn: counts.closing > 0 },
  ];

  if (loading) {
    return (
      <div
        style={{ backgroundColor: '#F8F6FA' }}
        className="min-h-screen -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-5 flex justify-center items-start pt-16"
      >
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#7A4B94', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: '#F8F6FA' }}
      className="min-h-screen -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-5 space-y-5"
    >
      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
      >
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-40 blur-2xl mix-blend-screen"
          style={{ backgroundColor: '#FF7A00' }}
        />
        <div
          className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-60 transform translate-x-8"
          style={{ backgroundColor: '#A238FF' }}
        />
        <div
          className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-30 blur-xl mix-blend-screen"
          style={{ backgroundColor: '#A238FF' }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="p-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: 'rgba(162,56,255,0.30)',
              border: '1px solid rgba(162,56,255,0.50)',
            }}
          >
            <FileText size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-0.5" style={{ color: '#EBD3FF' }}>
              ระบบจัดการโรงงาน
            </p>
            <h2 className="text-base font-bold">กระดาน RFQ — คำขอจากลูกค้า</h2>
          </div>
          <span className="text-sm font-semibold shrink-0" style={{ color: '#EBD3FF' }}>
            {counts.all} รายการ
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-700 shrink-0"
          >
            ลองอีกครั้ง
          </button>
        </div>
      ) : null}

      {noFactoryCategories ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-5 text-center space-y-3">
          <p className="text-sm font-semibold text-amber-950">เลือกหมวดหมู่ที่โรงงานรับผลิตก่อน</p>
          <p className="text-xs text-amber-900/90">จะมี RFQ match เมื่อมีหมวดหมู่ในโปรไฟล์แล้ว</p>
          <Link
            to="/factory/profile"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #E38844 0%, #C96D1A 100%)',
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            ไปที่ข้อมูลโรงงาน
          </Link>
        </div>
      ) : null}

      {!noFactoryCategories && rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4">
          <div className="text-5xl">📋</div>
          <p className="text-base font-bold" style={{ color: '#2E2252' }}>
            ยังไม่มี RFQ ที่ตรงกับหมวดหมู่โรงงานของคุณ
          </p>
          <p className="text-sm text-gray-500">ปรับหมวดหมู่เพื่อรับ RFQ ที่ตรงกับโรงงาน</p>
          <Link
            to="/factory/profile"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #E38844 0%, #C96D1A 100%)',
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            ปรับหมวดหมู่ในโปรไฟล์
          </Link>
        </div>
      ) : null}

      {!noFactoryCategories && rows.length > 0 ? (
        <>
          {/* Tab bar */}
          {narrowTabs ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">ชุดรายการ</label>
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as TabKey)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium"
              >
                {tabDefs.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.count}){t.warn && t.key === 'closing' ? ' ⚠' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ backgroundColor: 'rgba(46,34,82,0.07)' }}
              role="tablist"
              aria-label="สถานะใบเสนอราคา"
            >
              {tabDefs.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all"
                    style={{
                      backgroundColor: on ? '#E38844' : 'transparent',
                      color: on ? '#fff' : '#2E2252',
                      fontWeight: on ? 700 : 500,
                      boxShadow: on ? '0 2px 8px rgba(227,136,68,0.35)' : 'none',
                    }}
                  >
                    {t.label}
                    <span className="text-[11px] opacity-80">({t.count})</span>
                    {t.warn && t.key === 'closing' ? ' ⚠' : ''}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา ชื่อ / เลข RFQ"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="new">เรียง: ใหม่ล่าสุด</option>
              <option value="deadline">เรียง: ใกล้ปิด</option>
              <option value="budget">เรียง: งบสูงสุด</option>
              <option value="qty">เรียง: จำนวนมากสุด</option>
            </select>
          </div>

          {/* Additional filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 shrink-0 sm:hidden">
              <SlidersHorizontal size={14} /> กรอง
            </span>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm min-w-[7rem] focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">หมวดหมู่ทั้งหมด</option>
              {categoryOptions.map(([cid, name]) => (
                <option key={cid} value={String(cid)}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={filterRfqStatus}
              onChange={(e) => setFilterRfqStatus(e.target.value)}
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm min-w-[6.5rem] focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">สถานะ RFQ</option>
              <option value="OP">เปิดรับ (OP)</option>
              <option value="CL">ปิดแล้ว (CL)</option>
              <option value="CC">ยกเลิก (CC)</option>
            </select>
            <select
              value={filterShip}
              onChange={(e) => setFilterShip(e.target.value)}
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm min-w-[7rem] focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">วิธีส่งทั้งหมด</option>
              {shipOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 px-3 py-2 rounded-full text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700"
              >
                ล้างตัวกรอง ✕
              </button>
            ) : null}
          </div>

          {pipeline.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4">
              <div className="text-5xl">🔍</div>
              <p className="text-base font-bold" style={{ color: '#2E2252' }}>
                ไม่พบ RFQ ตามเงื่อนไข
              </p>
              <p className="text-sm text-gray-400">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #E38844 0%, #C96D1A 100%)',
                    boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                  }}
                >
                  ล้างตัวกรอง
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-3">
              {pipeline.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <RfqCard row={r as RfqCardModel} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
