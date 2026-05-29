import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  ChevronRight,
  Clock,
  Search,
  ClipboardList,
  Zap,
  Package,
  HelpCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { ordersApi } from '@/services/api/ordersApi';
import { useFactoryOrdersData } from '@/pages/factory-portal/factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from '@/pages/factory-portal/factory-orders/deriveOrderCardState';
import { computeKpi, countByTab } from '@/pages/factory-portal/factory-orders/factoryOrderKpi';
import { matchTab, searchMatch } from '@/pages/factory-portal/factory-orders/factoryOrderFilters';
import type { FactoryOrderRow, TabId } from '@/pages/factory-portal/factory-orders/types';
import { FactoryOrderCard } from '@/pages/factory-portal/factory-orders/components/FactoryOrderCard';
import { FactoryOrdersEmptyState } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersEmptyState';
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

const TAB_DEFS: {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'awaiting_customer',
    label: 'รอลูกค้า',
    shortLabel: 'รอลูกค้า',
    icon: <HelpCircle size={14} className='shrink-0' />,
  },
  {
    id: 'needs_action',
    label: 'ต้องดำเนินการ',
    shortLabel: 'ดำเนินการ',
    icon: <Zap size={14} className='shrink-0' />,
  },
  {
    id: 'in_production',
    label: 'กำลังผลิต',
    shortLabel: 'ผลิต',
    icon: <Package size={14} className='shrink-0' />,
  },
  {
    id: 'shipped',
    label: 'จัดส่งแล้ว',
    shortLabel: 'จัดส่ง',
    icon: <Truck size={14} className='shrink-0' />,
  },
  {
    id: 'completed',
    label: 'เสร็จสิ้น',
    shortLabel: 'เสร็จ',
    icon: <CheckCircle2 size={14} className='shrink-0' />,
  },
  {
    id: 'cancelled',
    label: 'ยกเลิก',
    shortLabel: 'ยกเลิก',
    icon: <XCircle size={14} className='shrink-0' />,
  },
  {
    id: 'all',
    label: 'ทั้งหมด',
    shortLabel: 'ทั้งหมด',
    icon: <ClipboardList size={14} className='shrink-0' />,
  },
];

export function FactoryOrdersPage() {
  const { data: rows = [], isLoading, isError, refetch, error } = useFactoryOrdersData();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState<TabId>('needs_action');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
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
      .sort((a, b) => {
        const diff =
          new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime();
        return sortDir === 'desc' ? diff : -diff;
      });
  }, [rows, derived, search, sortDir, statusTab]);

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
          <div className='h-96 rounded-2xl border border-gray-100 bg-white animate-pulse' />
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

      {isError ? (
        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
          <ErrorAlert className='flex-1'>
            {error instanceof Error ? error.message : 'โหลดออเดอร์ไม่สำเร็จ'}
          </ErrorAlert>
          <Button
            variant='unstyled'
            type='button'
            className='shrink-0 text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-700'
            onClick={() => void refetch()}
          >
            ลองใหม่
          </Button>
        </div>
      ) : null}

      {/* KPI strip — mirrors kind-filter cards on RFQ board */}
      <FactoryOrdersKpiStrip
        kpi={kpi}
        total={rows.length}
        onSelectKpi={(key) => {
          if (key === 'overdue') {
            setStatusTab('needs_action');
            return;
          }
          setStatusTab(key);
        }}
      />

      {/* Unified card: tabs + filter + table */}
      <div className='sticky top-14 z-[5] bg-brand-page py-2 -my-1'>
        <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
          {/* Tab row */}
          <div
            className='flex overflow-x-auto overflow-y-hidden border-b border-slate-100 [&::-webkit-scrollbar]:hidden'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role='tablist'
            aria-label='สถานะคำสั่งซื้อ'
          >
            {TAB_DEFS.map((t) => {
              const on = statusTab === t.id;
              const count = tabCounts[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  type='button'
                  role='tab'
                  aria-selected={on}
                  onClick={() => setStatusTab(t.id)}
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
                  {count > 0 ? (
                    <span
                      className='min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums'
                      style={{
                        background: on ? '#eef2ff' : '#f1f5f9',
                        color: on ? 'var(--brand-indigo)' : '#94a3b8',
                      }}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Filter row */}
          <div className='px-3 sm:px-4 pt-3 pb-3'>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Search
                  size={14}
                  className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า...'
                  className='h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-xs placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:text-[13px]'
                />
              </div>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className='h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors hover:bg-slate-50'
                title={sortDir === 'desc' ? 'ใหม่สุด → เก่าสุด' : 'เก่าสุด → ใหม่สุด'}
              >
                <ArrowUpDown className='h-4 w-4' />
                {sortDir === 'desc' ? 'ใหม่สุด' : 'เก่าสุด'}
              </Button>
            </div>

            {/* Empty state or edge-to-edge table */}
            {filteredRows.length === 0 ? (
              <div className='mt-3 py-12 text-center space-y-2'>
                <div className='text-4xl'>📦</div>
                <p className='text-sm font-bold text-slate-700'>ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข</p>
                <p className='text-xs text-slate-400'>ลองเปลี่ยนแท็บหรือค้นหาใหม่</p>
              </div>
            ) : (
              <div className='-mx-3 sm:-mx-4 mt-3 border-t border-slate-100 overflow-x-auto'>
                <Table className='w-full min-w-[700px]'>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent dark:hover:bg-transparent'>
                      {['Order', 'สินค้า', 'ลูกค้า', 'มูลค่า', 'สถานะ', 'กำหนดส่ง', ''].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeletonRows columns={7} rows={4} />
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
                          <TableRow key={row.order_id}>
                            <TableCell className='font-mono text-xs font-semibold text-indigo-600'>
                              #{row.order_id}
                            </TableCell>
                            <TableCell className='font-medium max-w-[180px] truncate'>
                              {row.rfq?.title ?? `สินค้า #${row.order_id}`}
                            </TableCell>
                            <TableCell className='text-slate-500 max-w-[140px] truncate'>
                              {row.customer?.display_name ?? '-'}
                            </TableCell>
                            <TableCell className='font-semibold tabular-nums'>
                              {formatCurrency(row.total_amount)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full text-[11px] font-semibold px-2.5 py-1 ${meta.cls}`}
                              >
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className='text-xs text-slate-500'>
                              <span className='flex items-center gap-1'>
                                <Clock size={11} className='shrink-0' />
                                {deadline}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant='unstyled'
                                type='button'
                                className='flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors'
                                onClick={() => navigate(`/factory/orders/${row.order_id}`)}
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile card list */}
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

      {/* Update step modal */}
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
              <h2 className='font-bold text-slate-900'>
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

      {/* Ship modal */}
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
              <h2 className='font-bold text-slate-900'>บันทึกจัดส่ง #{shipModal.row.order_id}</h2>
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
