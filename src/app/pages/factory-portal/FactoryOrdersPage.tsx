import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  Zap,
  Package,
  PackageX,
  HelpCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  FileCheck2,
} from 'lucide-react';
import { ordersApi } from '@/services/api/ordersApi';
import { useFactoryOrdersData } from '@/pages/factory-portal/factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from '@/pages/factory-portal/factory-orders/deriveOrderCardState';
import { computeKpi, countByTab } from '@/pages/factory-portal/factory-orders/factoryOrderKpi';
import { matchTab, searchMatch } from '@/pages/factory-portal/factory-orders/factoryOrderFilters';
import type { FactoryOrderRow, TabId } from '@/pages/factory-portal/factory-orders/types';
import {
  FactoryOrderCard,
  REQUEST_KIND_LABEL,
} from '@/pages/factory-portal/factory-orders/components/FactoryOrderCard';
import { FactoryOrdersEmptyState } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersEmptyState';
import { FactoryOrdersKpiStrip } from '@/pages/factory-portal/factory-orders/components/FactoryOrdersKpiStrip';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import { FactoryWorklistCard } from '@/pages/factory-portal/components/FactoryWorklistCard';
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
import { factoryButtonClass } from '@/pages/factory-portal/factoryUi';

const STATUS_LABEL: Record<string, { label: string; tone: FactoryStatusTone }> = {
  WS: { label: 'รอแนบสลิป', tone: 'warning' },
  WA: { label: 'รอยืนยันสลิป', tone: 'warning' },
  PP: { label: 'รอชำระเงิน', tone: 'warning' },
  PE: { label: 'หมดกำหนด', tone: 'danger' },
  PD: { label: 'ต้องดำเนินการ', tone: 'warning' },
  PR: { label: 'กำลังผลิต', tone: 'info' },
  QC: { label: 'ตรวจสอบ', tone: 'brand' },
  SH: { label: 'จัดส่งแล้ว', tone: 'teal' },
  CP: { label: 'เสร็จสิ้น', tone: 'success' },
  CN: { label: 'ยกเลิก', tone: 'danger' },
  CC: { label: 'ยกเลิก', tone: 'danger' },
  CL: { label: 'ยกเลิก', tone: 'danger' },
};

function statusMeta(code: string) {
  return STATUS_LABEL[code] ?? { label: code, tone: 'neutral' as const };
}

function SortableHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHead className='py-2 text-[10px]'>
      <span className='inline-flex items-center gap-1'>
        {children}
        <ArrowUpDown className='h-2.5 w-2.5 text-slate-400' aria-hidden />
      </span>
    </TableHead>
  );
}

function OrdersTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);
  if (total === 0) return null;
  return (
    <div className='flex flex-col gap-2 border-t border-slate-100 bg-white px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-xs text-slate-600'>
        แสดง <span className='font-semibold text-slate-900'>{start}</span> ถึง{' '}
        <span className='font-semibold text-slate-900'>{end}</span> จาก{' '}
        <span className='font-semibold text-slate-900'>{total}</span> รายการ
      </p>
      <div className='flex items-center gap-1'>
        <Button
          variant='unstyled'
          type='button'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={factoryButtonClass({ variant: 'toolbar', size: 'icon' })}
          aria-label='หน้าก่อน'
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </Button>
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant='unstyled'
            type='button'
            onClick={() => onPageChange(p)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors ${
              p === page
                ? 'bg-brand-purple text-white'
                : 'text-slate-600 hover:bg-[var(--brand-page)]'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ))}
        <Button
          variant='unstyled'
          type='button'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={factoryButtonClass({ variant: 'toolbar', size: 'icon' })}
          aria-label='หน้าถัดไป'
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 7;

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
    id: 'verify_slip',
    label: 'ยืนยันสลิป',
    shortLabel: 'สลิป',
    icon: <FileCheck2 size={14} className='shrink-0' />,
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
  const [page, setPage] = useState(1);
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
        const diff = new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime();
        return sortDir === 'desc' ? diff : -diff;
      });
  }, [rows, derived, search, sortDir, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filteredRows]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader
          title='คำสั่งซื้อ'
          subtitle='Factory / คำสั่งซื้อ'
          icon={ClipboardList}
          count={`${rows.length} รายการ`}
          variant='minimal'
        />
        <div className='space-y-3'>
          <div className='h-24 rounded-lg border border-gray-100 bg-white animate-pulse' />
          <div className='h-96 rounded-lg border border-gray-100 bg-white animate-pulse' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 pb-8'>
      <FactoryPageHeader
        title='คำสั่งซื้อ'
        subtitle='Factory / คำสั่งซื้อ'
        icon={ClipboardList}
        count={`${rows.length} รายการ`}
        variant='minimal'
      />

      {isError ? (
        <div className='flex flex-col sm:flex-row gap-2 sm:items-center'>
          <ErrorAlert className='flex-1'>
            {error instanceof Error ? error.message : 'โหลดออเดอร์ไม่สำเร็จ'}
          </ErrorAlert>
          <Button
            variant='unstyled'
            type='button'
            className='shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-700'
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

      <FactoryWorklistCard
        tabs={TAB_DEFS.map((t) => ({
          key: t.id,
          label: t.label,
          shortLabel: t.shortLabel,
          icon: t.icon,
          count: tabCounts[t.id] ?? 0,
        }))}
        activeTab={statusTab}
        onTabChange={(key) => setStatusTab(key as TabId)}
        tabAriaLabel='สถานะคำสั่งซื้อ'
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder='ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า...'
        searchTrailing={
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className='inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700 transition-colors hover:bg-[var(--brand-page)]'
            title={sortDir === 'desc' ? 'ใหม่สุด → เก่าสุด' : 'เก่าสุด → ใหม่สุด'}
          >
            <ArrowUpDown className='h-4 w-4' />
            {sortDir === 'desc' ? 'ใหม่สุด' : 'เก่าสุด'}
          </Button>
        }
      >
        {filteredRows.length === 0 ? (
          <div className='mt-3 space-y-2 py-12 text-center'>
            <PackageX size={38} className='mx-auto text-slate-400' />
            <p className='text-sm font-normal text-slate-700'>ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข</p>
            <p className='text-xs text-slate-400'>ลองเปลี่ยนแท็บหรือค้นหาใหม่</p>
          </div>
        ) : (
          <div className='-mx-3 mt-3 border-t border-slate-100 sm:-mx-4'>
            <div className='overflow-x-auto'>
              <Table className='w-full min-w-[760px]'>
                <TableHeader>
                  <TableRow className='hover:bg-transparent dark:hover:bg-transparent'>
                    <SortableHead>Order</SortableHead>
                    <SortableHead>สินค้า</SortableHead>
                    <SortableHead>ประเภท</SortableHead>
                    <SortableHead>ลูกค้า</SortableHead>
                    <SortableHead>มูลค่า</SortableHead>
                    <SortableHead>สถานะ</SortableHead>
                    <SortableHead>กำหนดส่ง</SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeletonRows columns={7} rows={4} />
                  ) : (
                    pageRows.map(({ row }) => {
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
                          className='cursor-pointer'
                          onClick={() => navigate(`/factory/orders/${row.order_id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/factory/orders/${row.order_id}`);
                            }
                          }}
                          tabIndex={0}
                          role='link'
                          aria-label={`คำสั่งซื้อ #${row.order_id}`}
                        >
                          <TableCell className='py-2.5 font-mono text-xs font-semibold text-brand-purple'>
                            #{row.order_id}
                          </TableCell>
                          <TableCell className='py-2.5 min-w-[180px]'>
                            <p className='truncate text-xs font-semibold text-slate-900 group-hover:text-brand-purple'>
                              {row.rfq?.title ?? `สินค้า #${row.order_id}`}
                            </p>
                            {row.rfq ? (
                              <p className='text-[10px] text-slate-400 mt-0.5'>
                                {row.rfq.quantity} {row.rfq.unit_name}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className='py-2.5 min-w-[110px]'>
                            {row.request_kind && REQUEST_KIND_LABEL[row.request_kind] ? (
                              <FactoryStatusBadge tone='brand'>
                                {REQUEST_KIND_LABEL[row.request_kind].label}
                              </FactoryStatusBadge>
                            ) : (
                              <span className='text-[10px] text-slate-400'>-</span>
                            )}
                          </TableCell>
                          <TableCell className='py-2.5 text-xs text-slate-600 min-w-[120px] max-w-[160px] truncate'>
                            {row.customer?.display_name ?? '-'}
                          </TableCell>
                          <TableCell className='py-2.5 text-xs font-semibold text-slate-900 tabular-nums'>
                            {formatCurrency(row.total_amount)}
                          </TableCell>
                          <TableCell className='py-2.5'>
                            <FactoryStatusBadge tone={meta.tone}>{meta.label}</FactoryStatusBadge>
                          </TableCell>
                          <TableCell className='py-2.5 text-xs text-slate-600 whitespace-nowrap'>
                            <span className='flex items-center gap-1'>
                              <Clock size={11} className='shrink-0' />
                              {deadline}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <OrdersTablePagination
              page={page}
              totalPages={totalPages}
              total={filteredRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </FactoryWorklistCard>

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
              className='rounded-lg border border-gray-100 bg-white transition-all duration-200'
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
          <div className='absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-lg bg-white border border-gray-100 p-4 space-y-3'>
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
              className='w-full min-h-[90px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-purple'
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
              className='w-full py-2.5 rounded-lg text-white font-normal disabled:opacity-50'
              style={{
                background: 'var(--brand-purple)',
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
          <div className='absolute inset-x-4 sm:inset-x-auto sm:right-6 sm:w-[460px] bottom-4 rounded-lg bg-white border border-gray-100 p-4 space-y-3'>
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
              className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-purple'
              placeholder='เลขพัสดุ'
              value={shipModal.tracking}
              onChange={(e) =>
                setShipModal((prev) => (prev ? { ...prev, tracking: e.target.value } : prev))
              }
            />
            <Textarea
              className='w-full min-h-[72px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-purple'
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
              className='w-full py-2.5 rounded-lg text-white font-normal disabled:opacity-50'
              style={{
                background: 'var(--brand-purple)',
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
