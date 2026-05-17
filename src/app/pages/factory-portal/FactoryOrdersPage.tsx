import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { X, ChevronRight, Clock } from 'lucide-react';
import { ordersApi } from '@/services/api/ordersApi';
import { useFactoryOrdersData } from '@/pages/factory-portal/factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from '@/pages/factory-portal/factory-orders/deriveOrderCardState';
import { computeKpi, countByTab } from '@/pages/factory-portal/factory-orders/factoryOrderKpi';
import {
  matchTab,
  searchMatch,
  sortCompare,
} from '@/pages/factory-portal/factory-orders/factoryOrderFilters';
import type { FactoryOrderRow, SortKey, TabId } from '@/pages/factory-portal/factory-orders/types';
import { FactoryOrderCard } from '@/pages/factory-portal/factory-orders/components/FactoryOrderCard';
import { FactoryOrdersEmptyState } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersEmptyState';
import { FactoryOrdersFilterBar } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersFilterBar';
import { FactoryOrdersKpiStrip } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersKpiStrip';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

const INDIGO = 'var(--brand-indigo)';
const SLATE_DARK = '#0F172A';

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

export function FactoryOrdersPage() {
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
  const kpi = useMemo(() => computeKpi(rows, derived), [rows, derived]);

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
      <div className='space-y-4'>
        <FactoryPageHeader
          title='คำสั่งซื้อ'
          subtitle='Factory / คำสั่งซื้อ'
          count={`${rows.length} รายการ`}
        />
        <div className='space-y-3'>
          <div className='h-24 rounded-2xl border border-gray-100 bg-white animate-pulse' />
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='h-40 rounded-2xl border border-gray-100 bg-white animate-pulse'
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 pb-8'>
      <FactoryPageHeader
        title='คำสั่งซื้อ'
        subtitle='Factory / คำสั่งซื้อ'
        count={`${rows.length} รายการ`}
      />

      <div className='space-y-4'>
        {isError ? (
          <ErrorAlert
            action={
              <Button
                variant='unstyled'
                type='button'
                className='px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold'
                onClick={() => void refetch()}
              >
                ลองใหม่
              </Button>
            }
          >
            {error instanceof Error ? error.message : 'โหลดออเดอร์ไม่สำเร็จ'}
          </ErrorAlert>
        ) : null}

        <FactoryOrdersKpiStrip
          kpi={kpi}
          onSelectKpi={(key) => {
            if (key === 'overdue') {
              setStatusTab('needs_action');
              setSortMode('deadline');
              return;
            }
            setStatusTab(key);
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

        <div className='hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <Table className='w-full text-sm min-w-[760px]'>
              <TableHeader>
                <TableRow className='bg-slate-50'>
                  {[
                    'Order ID',
                    'ชื่อสินค้า',
                    'ลูกค้า',
                    'มูลค่า',
                    'สถานะ',
                    'กำหนดส่ง',
                    'Actions',
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider'
                      style={{ color: 'var(--neutral-subtle)' }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows columns={7} rows={4} />
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='py-14 text-center text-sm text-gray-400'>
                      ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
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
                      <TableRow
                        key={row.order_id}
                        className='border-t border-gray-50 transition-colors'
                        style={{ cursor: 'default' }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            '#F8FAFC')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '')
                        }
                      >
                        <TableCell
                          className='px-4 py-3 font-mono text-xs font-semibold'
                          style={{ color: INDIGO }}
                        >
                          #{row.order_id}
                        </TableCell>
                        <TableCell
                          className='px-4 py-3 text-sm font-medium max-w-[180px] truncate'
                          style={{ color: SLATE_DARK }}
                        >
                          {row.rfq?.title ?? `สินค้า #${row.order_id}`}
                        </TableCell>
                        <TableCell className='px-4 py-3 text-sm text-gray-500 max-w-[140px] truncate'>
                          {row.customer?.display_name ?? '-'}
                        </TableCell>
                        <TableCell
                          className='px-4 py-3 text-sm font-semibold tabular-nums'
                          style={{ color: SLATE_DARK }}
                        >
                          {formatCurrency(row.total_amount)}
                        </TableCell>
                        <TableCell className='px-4 py-3'>
                          <span
                            className={`rounded-full text-[11px] font-semibold px-2.5 py-1 ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className='px-4 py-3 text-xs text-gray-500 flex items-center gap-1'>
                          <Clock size={12} className='shrink-0' />
                          {deadline}
                        </TableCell>
                        <TableCell className='px-4 py-3'>
                          <Button
                            variant='unstyled'
                            type='button'
                            className='flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors'
                            style={{ color: INDIGO, backgroundColor: `${INDIGO}15` }}
                            onClick={() => {
                              navigate(`/factory/orders/${row.order_id}`);
                            }}
                          >
                            ดู <ChevronRight size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <ul className='md:hidden grid grid-cols-1 gap-3'>
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
                className='rounded-2xl border border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'
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

      {updateModal ? (
        <div className='fixed inset-0 z-[70]'>
          <Button
            variant='unstyled'
            type='button'
            className='absolute inset-0 bg-black/40'
            onClick={() => setUpdateModal(null)}
          />
          <div className='absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='font-bold' style={{ color: SLATE_DARK }}>
                อัปเดตขั้น {updateModal.row.production_summary?.current_step_name_th}
              </h2>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setUpdateModal(null)}
                className='p-1 rounded-lg hover:bg-gray-100'
              >
                <X size={18} />
              </Button>
            </div>
            <Textarea
              className='w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-indigo'
              placeholder='รายละเอียดความคืบหน้า'
              value={updateModal.notes}
              onChange={(e) =>
                setUpdateModal((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
              }
            />
            <Button
              variant='unstyled'
              type='button'
              disabled={updateModal.busy || !updateModal.notes.trim()}
              className='w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50'
              style={{
                background: 'linear-gradient(135deg, var(--brand-indigo) 0%, #334155 100%)',
              }}
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
                } catch {
                  setUpdateModal((prev) => (prev ? { ...prev, busy: false } : prev));
                }
              }}
            >
              {updateModal.busy ? 'กำลังบันทึก...' : 'บันทึกอัปเดต'}
            </Button>
          </div>
        </div>
      ) : null}

      {shipModal ? (
        <div className='fixed inset-0 z-[70]'>
          <Button
            variant='unstyled'
            type='button'
            className='absolute inset-0 bg-black/40'
            onClick={() => setShipModal(null)}
          />
          <div className='absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='font-bold' style={{ color: SLATE_DARK }}>
                บันทึกจัดส่ง #{shipModal.row.order_id}
              </h2>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setShipModal(null)}
                className='p-1 rounded-lg hover:bg-gray-100'
              >
                <X size={18} />
              </Button>
            </div>
            <Input
              className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-indigo'
              placeholder='เลขพัสดุ'
              value={shipModal.tracking}
              onChange={(e) =>
                setShipModal((prev) => (prev ? { ...prev, tracking: e.target.value } : prev))
              }
            />
            <Textarea
              className='w-full min-h-[72px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-indigo'
              placeholder='หมายเหตุ (ไม่บังคับ)'
              value={shipModal.note}
              onChange={(e) =>
                setShipModal((prev) => (prev ? { ...prev, note: e.target.value } : prev))
              }
            />
            <Button
              variant='unstyled'
              type='button'
              disabled={shipModal.busy || !shipModal.tracking.trim()}
              className='w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-50'
              style={{
                background:
                  'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
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
                } catch {
                  setShipModal((prev) => (prev ? { ...prev, busy: false } : prev));
                }
              }}
            >
              {shipModal.busy ? 'กำลังบันทึก...' : 'ยืนยันบันทึกจัดส่ง'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
