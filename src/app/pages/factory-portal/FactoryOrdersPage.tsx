import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  Search,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { ordersApi } from '../../services/api';
import { useFactoryOrdersData } from './factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from './factory-orders/deriveOrderCardState';
import { countByTab } from './factory-orders/factoryOrderKpi';
import { matchTab, searchMatch, sortCompare } from './factory-orders/factoryOrderFilters';
import type { FactoryOrderRow, SortKey, TabId } from './factory-orders/types';
import { FactoryOrderCard } from './factory-orders/components/FactoryOrderCard';
import { FactoryOrdersEmptyState } from './factory-orders/components/FactoryOrdersEmptyState';
import { FactoryPageHeader } from './components/FactoryPageHeader';

/* ─── Design tokens ──────────────────────────────────────────────── */
const INDIGO = '#4F46E5';
const SLATE_DARK = '#0F172A';

/* ─── Status meta (for table badges) ─────────────────────────────── */
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PP: { label: 'รอยืนยัน', cls: 'bg-amber-100 text-amber-700' },
  PE: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
  PD: { label: 'รอชำระ', cls: 'bg-amber-100 text-amber-700' },
  PR: { label: 'กำลังผลิต', cls: 'bg-blue-100 text-blue-700' },
  QC: { label: 'ตรวจสอบ', cls: 'bg-indigo-100 text-indigo-700' },
  SH: { label: 'จัดส่งแล้ว', cls: 'bg-teal-100 text-teal-700' },
  CP: { label: 'เสร็จสิ้น', cls: 'bg-emerald-100 text-emerald-700' },
  CN: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
  CC: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
  CL: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
};

function statusMeta(code: string) {
  return STATUS_LABEL[code] ?? { label: code, cls: 'bg-gray-100 text-gray-600' };
}

/* ─── Tab definitions ─────────────────────────────────────────────── */
const TABS: { id: TabId; label: string }[] = [
  { id: 'needs_action', label: 'ต้องดำเนินการ' },
  { id: 'in_production', label: 'กำลังผลิต' },
  { id: 'awaiting_customer', label: 'รอลูกค้า' },
  { id: 'shipped', label: 'จัดส่งแล้ว' },
  { id: 'completed', label: 'เสร็จสิ้น' },
  { id: 'cancelled', label: 'ยกเลิก' },
];

/* ─── Skeleton ────────────────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function FactoryOrdersPage() {
  /* ── All existing hooks & state — unchanged ── */
  const { data: rows = [], isLoading, isError, refetch, error } = useFactoryOrdersData();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState<TabId>('needs_action');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortKey>('newest');
  const [updateModal, setUpdateModal] = useState<{
    row: FactoryOrderRow;
    notes: string;
    busy: boolean;
    stepId: number;
  } | null>(null);
  const [shipModal, setShipModal] = useState<{
    row: FactoryOrderRow;
    tracking: string;
    note: string;
    busy: boolean;
  } | null>(null);

  const now = useMemo(() => new Date(), []);
  const derived = useMemo(() => rows.map((r) => deriveOrderCardState(r, now)), [rows, now]);
  const tabCounts = useMemo(() => countByTab(rows, derived), [rows, derived]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map((r, i) => ({ row: r, derived: derived[i] }))
      .filter((x) => matchTab(x.row, x.derived, statusTab))
      .filter((x) => searchMatch(x.row, q))
      .sort((a, b) => sortCompare(a.row, b.row, sortMode));
  }, [rows, derived, search, sortMode, statusTab]);

  /* ─── Loading state ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <FactoryPageHeader title="คำสั่งซื้อ" subtitle="Factory / คำสั่งซื้อ" count={`${rows.length} รายการ`} />
        <div className="space-y-3">
          <div className="h-24 rounded-2xl border border-gray-100 bg-white animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-gray-100 bg-white animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main render ───────────────────────────────────────────────── */
  return (
    <div className="space-y-4 pb-8">
      <FactoryPageHeader title="คำสั่งซื้อ" subtitle="Factory / คำสั่งซื้อ" count={`${rows.length} รายการ`} />

      <div className="space-y-4">

        {/* ── Error ───────────────────────────────────────────────── */}
        {isError ? (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          >
            <span>{error instanceof Error ? error.message : 'โหลดออเดอร์ไม่สำเร็จ'}</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold"
              onClick={() => void refetch()}
            >
              ลองใหม่
            </button>
          </div>
        ) : null}

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3 overflow-hidden">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none" role="tablist">
            {TABS.map((tab) => {
              const active = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusTab(tab.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: INDIGO,
                          color: '#fff',
                          boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
                        }
                      : { backgroundColor: '#F3F4F6', color: '#4B5563' }
                  }
                >
                  {tab.label}
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                    style={
                      active
                        ? { backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' }
                        : { backgroundColor: '#E5E7EB', color: '#6B7280' }
                    }
                  >
                    {tabCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + sort row */}
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <label className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า"
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
            </label>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#4F46E5]"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortKey)}
            >
              <option value="newest">ล่าสุด</option>
              <option value="deadline">ใกล้กำหนดส่ง</option>
              <option value="amount_desc">มูลค่าสูงสุด</option>
            </select>
          </div>
        </div>

        {/* ── Desktop table ────────────────────────────────────────── */}
        <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-slate-50">
                  {['Order ID', 'ชื่อสินค้า', 'ลูกค้า', 'มูลค่า', 'สถานะ', 'กำหนดส่ง', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#6B7280' }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton />
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-sm text-gray-400">
                      ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ row }) => {
                    const meta = statusMeta(row.status);
                    const deadline = row.estimated_delivery
                      ? new Date(row.estimated_delivery).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '-';
                    return (
                      <tr
                        key={row.order_id}
                        className="border-t border-gray-50 transition-colors"
                        style={{ cursor: 'default' }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F8FAFC')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '')
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: INDIGO }}>
                          #{row.order_id}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium max-w-[180px] truncate"
                          style={{ color: SLATE_DARK }}
                        >
                          {row.rfq?.title ?? `สินค้า #${row.order_id}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[140px] truncate">
                          {row.customer?.display_name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: SLATE_DARK }}>
                          ฿{row.total_amount.toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full text-[11px] font-semibold px-2.5 py-1 ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} className="shrink-0" />
                          {deadline}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                            style={{ color: INDIGO, backgroundColor: `${INDIGO}15` }}
                            onClick={() => {
                              navigate(`/factory/orders/${row.order_id}`);
                            }}
                          >
                            ดู <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile card list ─────────────────────────────────────── */}
        <ul className="md:hidden grid grid-cols-1 gap-3">
          {filteredRows.length === 0 ? (
            <FactoryOrdersEmptyState
              hasAnyRows={rows.length > 0}
              tabId={statusTab}
              onResetTab={() => setStatusTab('all')}
            />
          ) : (
            filteredRows.map(({ row, derived: d }) => (
              <li
                key={row.order_id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <FactoryOrderCard
                  row={row}
                  derived={d}
                  onPrimaryCta={(r, cta) => {
                    if (cta.kind === 'update_step')
                      setUpdateModal({ row: r, notes: '', busy: false, stepId: cta.stepId });
                    if (cta.kind === 'mark_shipped')
                      setShipModal({ row: r, tracking: '', note: '', busy: false });
                  }}
                />
              </li>
            ))
          )}
        </ul>

      </div>

      {/* ══ Update-step modal (unchanged logic) ═══════════════════════ */}
      {updateModal ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setUpdateModal(null)}
          />
          <div className="absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold" style={{ color: SLATE_DARK }}>
                อัปเดตขั้น {updateModal.row.production_summary?.current_step_name_th}
              </h2>
              <button
                type="button"
                onClick={() => setUpdateModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
              placeholder="รายละเอียดความคืบหน้า"
              value={updateModal.notes}
              onChange={(e) =>
                setUpdateModal((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
              }
            />
            <button
              type="button"
              disabled={updateModal.busy || !updateModal.notes.trim()}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #334155 100%)' }}
              onClick={async () => {
                setUpdateModal((prev) => (prev ? { ...prev, busy: true } : prev));
                try {
                  await ordersApi.postProductionUpdate(updateModal.row.order_id, {
                    step_id: updateModal.stepId,
                    status: 'CD',
                    description: updateModal.notes.trim(),
                    image_urls: [],
                  });
                  setUpdateModal(null);
                  await refetch();
                } catch (e) {
                  console.error(e);
                  setUpdateModal((prev) => (prev ? { ...prev, busy: false } : prev));
                }
              }}
            >
              {updateModal.busy ? 'กำลังบันทึก...' : 'บันทึกอัปเดต'}
            </button>
          </div>
        </div>
      ) : null}

      {/* ══ Ship modal (unchanged logic) ══════════════════════════════ */}
      {shipModal ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShipModal(null)}
          />
          <div className="absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold" style={{ color: SLATE_DARK }}>
                บันทึกจัดส่ง #{shipModal.row.order_id}
              </h2>
              <button
                type="button"
                onClick={() => setShipModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
              placeholder="เลขพัสดุ"
              value={shipModal.tracking}
              onChange={(e) =>
                setShipModal((prev) => (prev ? { ...prev, tracking: e.target.value } : prev))
              }
            />
            <textarea
              className="w-full min-h-[72px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
              placeholder="หมายเหตุ (ไม่บังคับ)"
              value={shipModal.note}
              onChange={(e) =>
                setShipModal((prev) => (prev ? { ...prev, note: e.target.value } : prev))
              }
            />
            <button
              type="button"
              disabled={shipModal.busy || !shipModal.tracking.trim()}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
              }}
              onClick={async () => {
                setShipModal((prev) => (prev ? { ...prev, busy: true } : prev));
                try {
                  await ordersApi.ship(shipModal.row.order_id, {
                    tracking_number: shipModal.tracking.trim(),
                    note: shipModal.note.trim() || undefined,
                  });
                  setShipModal(null);
                  await refetch();
                } catch (e) {
                  console.error(e);
                  setShipModal((prev) => (prev ? { ...prev, busy: false } : prev));
                }
              }}
            >
              {shipModal.busy ? 'กำลังบันทึก...' : 'ยืนยันบันทึกจัดส่ง'}
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
