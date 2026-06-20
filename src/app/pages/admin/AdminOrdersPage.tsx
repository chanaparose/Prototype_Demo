import React, { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/services/api/adminApi';
import type { IAdminOrderListResponse } from '@/services/api/types/admin.types';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableContainer,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
  TableSkeletonRows,
} from '@/components/admin/AdminTable';

type OrderStatusTab = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';

interface AdminOrderView {
  order_id: string;
  buyer: string;
  factory: string;
  total_amount: number;
  commission_amount: number;
  vat_amount: number;
  status: string;
  created_at: string;
}

const STATUS_META: Record<OrderStatusTab, { label: string; variant: string }> = {
  all: { label: 'ทั้งหมด', variant: 'default' },
  pending: { label: 'รอดำเนินการ', variant: 'pending' },
  processing: { label: 'กำลังดำเนินการ', variant: 'info' },
  completed: { label: 'เสร็จสิ้น', variant: 'success' },
  cancelled: { label: 'ยกเลิก', variant: 'error' },
};

const STATUS_TABS: { key: OrderStatusTab; label: string; apiStatus?: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ', apiStatus: 'OP' },
  { key: 'processing', label: 'กำลังดำเนินการ', apiStatus: 'PR' },
  { key: 'completed', label: 'เสร็จสิ้น', apiStatus: 'CM' },
  { key: 'cancelled', label: 'ยกเลิก', apiStatus: 'CL' },
];

function inferTab(status: string): OrderStatusTab {
  const s = pickScalarString(status).toUpperCase();
  if (s === 'CM' || s === 'DONE' || s === 'COMPLETED') return 'completed';
  if (s === 'CL' || s === 'CANCELLED') return 'cancelled';
  if (s === 'OP' || s === 'PENDING' || s === 'PD') return 'pending';
  return 'processing';
}

function toRows(raw: unknown): IAdminOrderListResponse[] {
  if (Array.isArray(raw)) return raw as IAdminOrderListResponse[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as IAdminOrderListResponse[];
    if (Array.isArray(obj.data)) return obj.data as IAdminOrderListResponse[];
    if (Array.isArray(obj.rows)) return obj.rows as IAdminOrderListResponse[];
  }
  return [];
}

function mapOrder(row: IAdminOrderListResponse): AdminOrderView {
  return {
    order_id: pickScalarString(row.order_id),
    buyer: pickScalarString(row.customer_name, '-'),
    factory: pickScalarString(row.factory_name, '-'),
    total_amount: pickScalarNumber(row.total_amount) ?? 0,
    commission_amount: pickScalarNumber(row.platform_commission_amount) ?? 0,
    vat_amount: pickScalarNumber(row.vat_amount) ?? 0,
    status: pickScalarString(row.status, 'OP'),
    created_at: pickScalarString(row.created_at),
  };
}

export function AdminOrdersPage() {
  const [statusTab, setStatusTab] = useState<OrderStatusTab>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<AdminOrderView[]>([]);
  const [countRows, setCountRows] = useState<AdminOrderView[]>([]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const baseParams = {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search.trim() || undefined,
        page: 1,
        page_size: 200,
      };
      const raw = await adminApi.listOrders(baseParams);
      const mapped = toRows(raw).map(mapOrder);
      setCountRows(mapped);
      setRows(statusTab === 'all' ? mapped : mapped.filter((row) => inferTab(row.status) === statusTab));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ');
      setRows([]);
      setCountRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      void loadOrders();
    }, 300);
    return () => clearTimeout(id);
  }, [statusTab, dateFrom, dateTo, search]);

  const counts = useMemo(() => {
    const result: Record<OrderStatusTab, number> = {
      all: countRows.length,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    countRows.forEach((r) => {
      result[inferTab(r.status)] += 1;
    });
    return result;
  }, [countRows]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, o) => ({
        total: acc.total + o.total_amount,
        commission: acc.commission + o.commission_amount,
        vat: acc.vat + o.vat_amount,
      }),
      { total: 0, commission: 0, vat: 0 },
    );
  }, [rows]);

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / คำสั่งซื้อ</p>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 mt-1'>จัดการคำสั่งซื้อ</h2>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6'>
        <SummaryCard
          label='ยอดรวมทั้งหมด'
          value={formatCurrencyNoDecimals(summary.total)}
          cls='border-purple-200 bg-purple-50'
          labelCls='text-purple-600'
        />
        <SummaryCard
          label='ค่าคอมมิชชัน'
          value={formatCurrencyNoDecimals(summary.commission)}
          cls='border-emerald-200 bg-emerald-50'
          labelCls='text-emerald-600'
        />
        <SummaryCard
          label='VAT รวม'
          value={formatCurrencyNoDecimals(summary.vat)}
          cls='border-violet-200 bg-violet-50'
          labelCls='text-violet-600'
        />
      </div>

      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative w-full max-w-sm'>
            <Search
              size={13}
              className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400'
            />
            <Input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='ค้นหา order/customer/factory'
              className='w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Label className='text-xs font-semibold text-slate-600 whitespace-nowrap'>
              ตั้งแต่
            </Label>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder='วันที่เริ่มต้น'
              className='h-9 w-36 rounded-lg border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-none'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Label className='text-xs font-semibold text-slate-600 whitespace-nowrap'>ถึง</Label>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder='วันที่สิ้นสุด'
              className='h-9 w-36 rounded-lg border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-none'
            />
          </div>
        </div>

        <div className='flex gap-1 flex-wrap'>
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <Button
                variant='unstyled'
                key={tab.key}
                type='button'
                onClick={() => setStatusTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-600 border border-purple-100 hover:bg-purple-50 hover:border-purple-200'
                }`}
              >
                {tab.label}
                <Badge
                  variant={active ? 'active' : 'outline'}
                  size='sm'
                  className={active ? '' : 'border-purple-100 bg-white text-purple-600'}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : null}

      <AdminTableContainer>
        <AdminTable className='min-w-[900px]'>
          <AdminTableHeader>
            <AdminTableRow>
                <AdminTableHead>
                  Order ID
                </AdminTableHead>
                <AdminTableHead>
                  ผู้ซื้อ
                </AdminTableHead>
                <AdminTableHead>
                  โรงงาน
                </AdminTableHead>
                <AdminTableHead className='text-right'>
                  ยอดรวม
                </AdminTableHead>
                <AdminTableHead>
                  ค่าคอม
                </AdminTableHead>
                <AdminTableHead>
                  VAT
                </AdminTableHead>
                <AdminTableHead>
                  สถานะ
                </AdminTableHead>
                <AdminTableHead>
                  วันที่
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody className='divide-y divide-slate-100'>
              {loading ? (
                <TableSkeletonRows columns={8} rows={3} />
              ) : rows.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={8} className='py-12 text-center text-sm text-slate-400'>
                    ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                rows.map((order) => {
                  const tab = inferTab(order.status);
                  const meta = STATUS_META[tab];
                  return (
                    <AdminTableRow key={order.order_id} className='hover:bg-slate-50 transition-colors'>
                      <AdminTableCell className='px-4 py-3 font-mono text-xs text-purple-600 font-semibold'>
                        #{order.order_id}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-700 max-w-[140px] truncate'>
                        {order.buyer}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-500 max-w-[140px] truncate'>
                        {order.factory}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-900 font-semibold text-right tabular-nums'>
                        {formatCurrencyNoDecimals(order.total_amount)}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-purple-700 font-semibold tabular-nums'>
                        {order.commission_amount > 0 ? (
                          formatCurrencyNoDecimals(order.commission_amount)
                        ) : (
                          <span className='text-slate-300 font-normal text-xs'>ยกเว้น</span>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-violet-700 font-semibold tabular-nums'>
                        {formatCurrencyNoDecimals(order.vat_amount)}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3'>
                        <Badge variant={meta.variant as any} size='sm'>
                          {meta.label}
                        </Badge>
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-xs text-slate-400 tabular-nums'>
                        {order.created_at.slice(0, 10)}
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })
              )}
            </AdminTableBody>
            {!loading && rows.length > 0 ? (
              <tfoot>
                <AdminTableRow className='bg-purple-50 border-t-2 border-purple-200'>
                  <AdminTableCell className='px-4 py-3 text-xs font-bold text-purple-700' colSpan={3}>
                    รวม {rows.length} รายการ
                  </AdminTableCell>
                  <AdminTableCell className='px-4 py-3 text-sm font-bold text-purple-900 text-right tabular-nums'>
                    {formatCurrencyNoDecimals(summary.total)}
                  </AdminTableCell>
                  <AdminTableCell className='px-4 py-3 text-sm font-bold text-purple-700 tabular-nums'>
                    {formatCurrencyNoDecimals(summary.commission)}
                  </AdminTableCell>
                  <AdminTableCell className='px-4 py-3 text-sm font-bold text-violet-700 tabular-nums'>
                    {formatCurrencyNoDecimals(summary.vat)}
                  </AdminTableCell>
                  <AdminTableCell colSpan={2} />
                </AdminTableRow>
              </tfoot>
            ) : null}
          </AdminTable>
      </AdminTableContainer>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  cls,
  labelCls,
}: {
  label: string;
  value: string;
  cls: string;
  labelCls: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className={`text-xs font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className='text-xl font-bold text-slate-900 tabular-nums'>{value}</p>
    </div>
  );
}
