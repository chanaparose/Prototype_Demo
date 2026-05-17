import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Filter, Search, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/services/api/adminApi';
import type { IAdminOrderListResponse } from '@/services/api/types/admin.types';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';

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

const STATUS_META: Record<OrderStatusTab, { label: string; cls: string }> = {
  all: { label: 'ทั้งหมด', cls: '' },
  pending: { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: 'กำลังดำเนินการ', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'เสร็จสิ้น', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-700' },
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

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const status = STATUS_TABS.find((t) => t.key === statusTab)?.apiStatus;
      const raw = await adminApi.listOrders({
        status,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search.trim() || undefined,
        page: 1,
        page_size: 200,
      });
      setRows(toRows(raw).map(mapOrder));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ');
      setRows([]);
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
      all: rows.length,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    rows.forEach((r) => {
      result[inferTab(r.status)] += 1;
    });
    return result;
  }, [rows]);

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
    <div className='space-y-6'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / คำสั่งซื้อ</p>
        <h2 className='text-2xl font-bold text-slate-900 mt-1'>จัดการคำสั่งซื้อ</h2>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <SummaryCard
          label='ยอดรวมทั้งหมด'
          value={formatCurrencyNoDecimals(summary.total)}
          cls='border-indigo-200 bg-indigo-50'
          labelCls='text-indigo-600'
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

      <div className='bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3'>
        <div className='flex flex-wrap items-center gap-3'>
          <Filter size={14} className='text-slate-400 shrink-0' />
          <div className='relative flex-1 min-w-[220px]'>
            <Search
              size={13}
              className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400'
            />
            <Input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='ค้นหา order/customer/factory'
              className='w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Label className='text-xs font-semibold text-slate-600 whitespace-nowrap'>
              ตั้งแต่
            </Label>
            <div className='relative'>
              <Calendar
                size={13}
                className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <Input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className='pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Label className='text-xs font-semibold text-slate-600 whitespace-nowrap'>ถึง</Label>
            <div className='relative'>
              <Calendar
                size={13}
                className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <Input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className='pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  {count}
                </span>
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

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table className='w-full text-sm min-w-[900px]'>
            <TableHeader>
              <TableRow className='bg-slate-50 border-b border-slate-200'>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  Order ID
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  ผู้ซื้อ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  โรงงาน
                </TableHead>
                <TableHead className='text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  ยอดรวม
                </TableHead>
                <TableHead className='text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  ค่าคอม
                </TableHead>
                <TableHead className='text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  VAT
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  สถานะ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  วันที่
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='divide-y divide-slate-100'>
              {loading ? (
                <TableSkeletonRows columns={8} rows={3} />
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='py-12 text-center text-sm text-slate-400'>
                    ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((order) => {
                  const tab = inferTab(order.status);
                  const meta = STATUS_META[tab];
                  return (
                    <TableRow key={order.order_id} className='hover:bg-slate-50 transition-colors'>
                      <TableCell className='px-4 py-3 font-mono text-xs text-indigo-600 font-semibold'>
                        #{order.order_id}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-700 max-w-[140px] truncate'>
                        {order.buyer}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-500 max-w-[140px] truncate'>
                        {order.factory}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-900 font-semibold text-right tabular-nums'>
                        {formatCurrencyNoDecimals(order.total_amount)}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-indigo-700 font-semibold text-right tabular-nums'>
                        {order.commission_amount > 0 ? (
                          formatCurrencyNoDecimals(order.commission_amount)
                        ) : (
                          <span className='text-slate-300 font-normal text-xs'>ยกเว้น</span>
                        )}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-violet-700 font-semibold text-right tabular-nums'>
                        {formatCurrencyNoDecimals(order.vat_amount)}
                      </TableCell>
                      <TableCell className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className='px-4 py-3 text-xs text-slate-400 tabular-nums'>
                        {order.created_at.slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {!loading && rows.length > 0 ? (
              <tfoot>
                <TableRow className='bg-indigo-50 border-t-2 border-indigo-200'>
                  <TableCell className='px-4 py-3 text-xs font-bold text-indigo-700' colSpan={3}>
                    รวม {rows.length} รายการ
                  </TableCell>
                  <TableCell className='px-4 py-3 text-sm font-bold text-indigo-900 text-right tabular-nums'>
                    {formatCurrencyNoDecimals(summary.total)}
                  </TableCell>
                  <TableCell className='px-4 py-3 text-sm font-bold text-indigo-700 text-right tabular-nums'>
                    {formatCurrencyNoDecimals(summary.commission)}
                  </TableCell>
                  <TableCell className='px-4 py-3 text-sm font-bold text-violet-700 text-right tabular-nums'>
                    {formatCurrencyNoDecimals(summary.vat)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </tfoot>
            ) : null}
          </Table>
        </div>
      </div>
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
