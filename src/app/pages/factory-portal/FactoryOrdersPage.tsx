import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { useFactoryOrdersData } from './factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from './factory-orders/deriveOrderCardState';
import { computeKpi, countByTab } from './factory-orders/factoryOrderKpi';
import { matchTab, searchMatch, sortCompare } from './factory-orders/factoryOrderFilters';
import type { FactoryOrderRow, SortKey, TabId, DerivedCardState } from './factory-orders/types';
import { FactoryOrdersKpiStrip } from './factory-orders/components/FactoryOrdersKpiStrip';
import { FactoryOrdersFilterBar } from './factory-orders/components/FactoryOrdersFilterBar';
import { FactoryOrderCard } from './factory-orders/components/FactoryOrderCard';
import { FactoryOrdersEmptyState } from './factory-orders/components/FactoryOrdersEmptyState';

export function FactoryOrdersPage() {
  const { data: rows = [], isLoading, isError, refetch, error } = useFactoryOrdersData();
  const [statusTab, setStatusTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortKey>('newest');
  const [updateModal, setUpdateModal] = useState<{ row: FactoryOrderRow; notes: string; busy: boolean; stepId: number } | null>(null);
  const [shipModal, setShipModal] = useState<{ row: FactoryOrderRow; tracking: string; note: string; busy: boolean } | null>(null);
  const now = useMemo(() => new Date(), []);
  const derived = useMemo(() => rows.map((r) => deriveOrderCardState(r, now)), [rows, now]);
  const tabCounts = useMemo(() => countByTab(rows, derived), [rows, derived]);
  const kpis = useMemo(() => computeKpi(rows, derived), [rows, derived]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map((r, i) => ({ row: r, derived: derived[i] }))
      .filter((x) => matchTab(x.row, x.derived, statusTab))
      .filter((x) => searchMatch(x.row, q))
      .sort((a, b) => sortCompare(a.row, b.row, sortMode));
  }, [rows, derived, search, sortMode, statusTab]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-gray-100 bg-white animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl border border-gray-100 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0 pb-6 sm:pb-8">
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">คำสั่งซื้อ</p>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">ออเดอร์ของโรงงาน</h1>
      </div>
      {isError ? (
        <div role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span>{error instanceof Error ? error.message : 'โหลดออเดอร์ไม่สำเร็จ'}</span>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700"
            onClick={() => void refetch()}
          >
            ลองใหม่
          </button>
        </div>
      ) : null}
      <FactoryOrdersKpiStrip
        kpi={kpis}
        onSelectKpi={(key) => {
          if (key === 'overdue') {
            setStatusTab('all');
            setSearch('');
            return;
          }
          setStatusTab(key === 'needs_action' ? 'needs_action' : key === 'in_production' ? 'in_production' : 'shipped');
        }}
      />
      <FactoryOrdersFilterBar
        tabId={statusTab}
        onTabChange={setStatusTab}
        tabCounts={tabCounts}
        sortKey={sortMode}
        onSortChange={setSortMode}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredRows.length === 0 ? (
          <FactoryOrdersEmptyState hasAnyRows={rows.length > 0} tabId={statusTab} onResetTab={() => setStatusTab('all')} />
        ) : (
          filteredRows.map(({ row, derived }) => (
            <li key={row.order_id}>
              <FactoryOrderCard
                row={row}
                derived={derived}
                onPrimaryCta={(r, cta) => {
                  if (cta.kind === 'update_step') setUpdateModal({ row: r, notes: '', busy: false, stepId: cta.stepId });
                  if (cta.kind === 'mark_shipped') setShipModal({ row: r, tracking: '', note: '', busy: false });
                }}
              />
            </li>
          ))
        )}
      </ul>

      {updateModal ? (
        <div className="fixed inset-0 z-[70]">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setUpdateModal(null)} />
          <div className="absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">อัปเดตขั้น {updateModal.row.production_summary?.current_step_name_th}</h2>
              <button type="button" onClick={() => setUpdateModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="รายละเอียดความคืบหน้า"
              value={updateModal.notes}
              onChange={(e) => setUpdateModal((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
            />
            <button
              type="button"
              disabled={updateModal.busy || !updateModal.notes.trim()}
              className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
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

      {shipModal ? (
        <div className="fixed inset-0 z-[70]">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setShipModal(null)} />
          <div className="absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">บันทึกจัดส่ง #{shipModal.row.order_id}</h2>
              <button type="button" onClick={() => setShipModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="เลขพัสดุ"
              value={shipModal.tracking}
              onChange={(e) => setShipModal((prev) => (prev ? { ...prev, tracking: e.target.value } : prev))}
            />
            <textarea
              className="w-full min-h-[72px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="หมายเหตุ (ไม่บังคับ)"
              value={shipModal.note}
              onChange={(e) => setShipModal((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
            />
            <button
              type="button"
              disabled={shipModal.busy || !shipModal.tracking.trim()}
              className="w-full py-2.5 rounded-xl text-white font-semibold bg-sky-600 disabled:opacity-50"
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
