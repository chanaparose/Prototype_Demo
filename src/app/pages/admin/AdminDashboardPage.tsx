import React, { useMemo } from 'react';
import { Link } from 'react-router';
import {
  TrendingUp,
  BadgePercent,
  Receipt,
  ShoppingCart,
  ClipboardList,
  Factory,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCompactNumber, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { EMPTY_ADMIN_DASHBOARD } from '@/domain/admin/mappers/mapAdminDashboard';
import { useAdminDashboardQuery } from '@/domain/admin/queries/useAdminDashboardQuery';
import { useAdminTopCustomersQuery } from '@/domain/admin/queries/useAdminTopCustomersQuery';
import { StatusBadge as SharedStatusBadge } from '@/shared/ui/badges/StatusBadge';
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

interface KpiCard {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function toCurrency(value: number): string {
  return formatCurrencyNoDecimals(value);
}

function orderStatusMeta(status: string): { label: string; cls: string } {
  const s = pickScalarString(status).toUpperCase();
  if (s === 'CM' || s === 'DONE' || s === 'COMPLETED')
    return { label: 'เสร็จสิ้น', cls: 'bg-emerald-100 text-emerald-700' };
  if (s === 'CL' || s === 'CANCELLED') return { label: 'ยกเลิก', cls: 'bg-red-100 text-red-700' };
  if (s === 'OP' || s === 'PENDING' || s === 'PD')
    return { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'กำลังดำเนินการ', cls: 'bg-blue-100 text-blue-700' };
}

function rfqStatusMeta(status: string): { label: string; cls: string } {
  const s = pickScalarString(status).toUpperCase();
  if (s === 'CL' || s === 'CC') return { label: 'ปิด', cls: 'bg-slate-100 text-slate-500' };
  if (s === 'MT' || s === 'MATCHED')
    return { label: 'จับคู่แล้ว', cls: 'bg-blue-100 text-blue-700' };
  return { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' };
}

function AdminStatusBadge({ label, cls }: { label: string; cls: string }) {
  const variant = cls.includes('red')
    ? 'error'
    : cls.includes('emerald') || cls.includes('green')
      ? 'success'
      : cls.includes('blue') || cls.includes('indigo')
        ? 'info'
        : cls.includes('amber') || cls.includes('yellow')
          ? 'pending'
          : 'inactive';
  return (
    <SharedStatusBadge variant={variant} size='sm' className='border-transparent'>
      {label}
    </SharedStatusBadge>
  );
}

function TopCustomersWidget() {
  const topCustomersQ = useAdminTopCustomersQuery(5);
  const topCustomers = topCustomersQ.data ?? [];
  const loading = topCustomersQ.isLoading;

  return (
    <div className='bg-white rounded-xl border border-slate-200 p-5 lg:p-7'>
      <div className='flex items-center justify-between mb-4 lg:mb-6'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>Top 5 ลูกค้า</h3>
          <p className='text-xs text-slate-400 mt-0.5'>ยอดซื้อสูงสุด</p>
        </div>
        <Link to='/admin/customers' className='text-xs text-purple-600 hover:underline font-medium'>
          ดูทั้งหมด →
        </Link>
      </div>

      {loading ? (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3'>
              <div className='w-5 h-4 bg-slate-100 rounded animate-pulse' />
              <div className='flex-1 h-4 bg-slate-100 rounded animate-pulse' />
              <div className='w-20 h-4 bg-slate-100 rounded animate-pulse' />
            </div>
          ))}
        </div>
      ) : topCustomers.length === 0 ? (
        <p className='text-sm text-slate-400 text-center py-6'>ยังไม่มีข้อมูล</p>
      ) : (
        <ol className='space-y-3'>
          {topCustomers.map((c, i) => (
            <li key={c.user_id} className='flex items-center gap-3'>
              <span className='w-5 text-center text-xs font-bold text-slate-400 shrink-0'>
                {i + 1}
              </span>
              <Link
                to={`/admin/customers/${c.user_id}`}
                className='flex-1 min-w-0 hover:text-purple-600 transition-colors'
              >
                <p className='text-sm font-medium text-slate-900 truncate'>
                  {c.first_name} {c.last_name}
                </p>
                <p className='text-xs text-slate-400 truncate'>{c.email}</p>
              </Link>
              <div className='text-right shrink-0'>
                <p className='text-sm font-semibold text-purple-700'>
                  {formatCurrencyNoDecimals(pickScalarNumber(c.total_spend) ?? 0)}
                </p>
                <p className='text-xs text-slate-400'>{c.total_orders} ออเดอร์</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AdminDashboardPage() {
  const dashboardQ = useAdminDashboardQuery();
  const dashboard = dashboardQ.data ?? EMPTY_ADMIN_DASHBOARD;
  const loading = dashboardQ.isLoading;
  const error =
    dashboardQ.error instanceof Error
      ? dashboardQ.error.message
      : dashboardQ.error
        ? 'โหลดข้อมูลไม่สำเร็จ'
        : '';

  const { summary, revenueRows, recentOrders, recentRfqs } = dashboard;

  const kpiData = useMemo<KpiCard[]>(() => {
    const gross = pickScalarNumber(summary.gross_order_value, summary.total_revenue) ?? 0;
    const commission =
      pickScalarNumber(summary.platform_commission, summary.platform_commission_amount) ?? 0;
    const vat = pickScalarNumber(summary.vat_collected, summary.vat_amount) ?? 0;
    const totalOrders =
      pickScalarNumber(summary.total_orders, summary.order_count) ?? recentOrders.length;
    const totalRfqs = pickScalarNumber(summary.total_rfqs, summary.new_rfqs) ?? recentRfqs.length;
    const pendingFactories =
      pickScalarNumber(summary.pending_factory_approvals, summary.pending_factories) ?? 0;

    return [
      {
        label: 'รายได้รวม',
        value: toCurrency(gross),
        icon: TrendingUp,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'ค่าคอมมิชชัน',
        value: toCurrency(commission),
        icon: BadgePercent,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        label: 'VAT รวม',
        value: toCurrency(vat),
        icon: Receipt,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
      {
        label: 'คำสั่งซื้อทั้งหมด',
        value: formatCompactNumber(totalOrders),
        icon: ShoppingCart,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'RFQ ใหม่',
        value: formatCompactNumber(totalRfqs),
        icon: ClipboardList,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
      {
        label: 'โรงงานรอ Approve',
        value: formatCompactNumber(pendingFactories),
        icon: Factory,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
      },
    ];
  }, [summary, recentOrders.length, recentRfqs.length]);

  const orderStatusData = useMemo(() => {
    const counts = { completed: 0, processing: 0, pending: 0, cancelled: 0 };
    recentOrders.forEach((o) => {
      const s = pickScalarString(o.status).toUpperCase();
      if (s === 'CM' || s === 'DONE' || s === 'COMPLETED') counts.completed += 1;
      else if (s === 'CL' || s === 'CANCELLED') counts.cancelled += 1;
      else if (s === 'OP' || s === 'PENDING' || s === 'PD') counts.pending += 1;
      else counts.processing += 1;
    });

    return [
      { name: 'เสร็จสิ้น', value: counts.completed, color: '#10b981' },
      { name: 'กำลังดำเนินการ', value: counts.processing, color: '#6366f1' },
      { name: 'รอดำเนินการ', value: counts.pending, color: '#f59e0b' },
      { name: 'ยกเลิก', value: counts.cancelled, color: '#ef4444' },
    ];
  }, [recentOrders]);

  return (
    <div className='space-y-8 lg:space-y-10'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / แดชบอร์ด</p>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 mt-1'>ภาพรวมระบบ</h2>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : null}

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6'>
        {kpiData.map((card) => {
          const Icon = card.icon;
          const isUp = typeof card.change === 'number' ? card.change > 0 : null;
          const isFlat = card.change === 0;
          return (
            <div
              key={card.label}
              className='bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow'
            >
              <div
                className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}
              >
                <Icon size={18} className={card.iconColor} />
              </div>
              <p className='text-xs text-slate-500 font-medium mb-1'>{card.label}</p>
              <p className='text-lg font-bold text-slate-900 leading-none'>
                {loading ? '...' : card.value}
              </p>
              {typeof card.change === 'number' && !isFlat ? (
                <div
                  className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(card.change)}% vs เดือนที่แล้ว
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5'>
          <h3 className='text-sm font-semibold text-slate-900 mb-1'>รายได้ & ค่าคอมมิชชัน</h3>
          <p className='text-xs text-slate-400 mb-5'>6 เดือนย้อนหลัง (บาท)</p>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={revenueRows} barGap={4}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
              <XAxis
                dataKey='month'
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [toCurrency(value), '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey='revenue' name='รายได้' fill='#6366f1' radius={[4, 4, 0, 0]} />
              <Bar dataKey='commission' name='ค่าคอม' fill='#a5b4fc' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-5'>
          <h3 className='text-sm font-semibold text-slate-900 mb-1'>สถานะคำสั่งซื้อ</h3>
          <p className='text-xs text-slate-400 mb-4'>5 รายการล่าสุด</p>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx='50%'
                cy='45%'
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey='value'
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType='circle'
                iconSize={8}
                formatter={(value: string) => <span style={{ fontSize: 11 }}>{value}</span>}
              />
              <Tooltip
                formatter={(value: number) => [value, 'คำสั่งซื้อ']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <TopCustomersWidget />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
          <div className='px-5 py-4 border-b border-slate-100'>
            <h3 className='text-sm font-semibold text-slate-900'>คำสั่งซื้อล่าสุด</h3>
            <p className='text-xs text-slate-400 mt-0.5'>5 รายการล่าสุด</p>
          </div>
          <AdminTableContainer>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>
                    Order ID
                  </AdminTableHead>
                  <AdminTableHead>
                    ผู้ซื้อ
                  </AdminTableHead>
                  <AdminTableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                    ยอดรวม
                  </AdminTableHead>
                  <AdminTableHead>
                    สถานะ
                  </AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody className='divide-y divide-slate-50'>
                {loading ? (
                  <TableSkeletonRows columns={4} rows={3} />
                ) : recentOrders.length === 0 ? (
                  <AdminTableRow>
                    <AdminTableCell
                      colSpan={4}
                      className='px-4 py-10 text-center text-sm text-slate-400'
                    >
                      ไม่มีข้อมูลคำสั่งซื้อ
                    </AdminTableCell>
                  </AdminTableRow>
                ) : (
                  recentOrders.map((order) => {
                    const status = orderStatusMeta(pickScalarString(order.status));
                    return (
                      <AdminTableRow
                        key={pickScalarString(order.order_id)}
                        className='hover:bg-slate-50 transition-colors'
                      >
                        <AdminTableCell className='px-4 py-3 font-mono text-xs text-purple-600 font-semibold'>
                          #{order.order_id}
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3 text-xs text-slate-700 max-w-[120px] truncate'>
                          {order.customer_name ?? '-'}
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3 text-xs text-slate-900 font-semibold text-right tabular-nums'>
                          {toCurrency(pickScalarNumber(order.total_amount) ?? 0)}
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3'>
                          <AdminStatusBadge label={status.label} cls={status.cls} />
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })
                )}
              </AdminTableBody>
            </AdminTable>
          </AdminTableContainer>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
          <div className='px-5 py-4 border-b border-slate-100'>
            <h3 className='text-sm font-semibold text-slate-900'>RFQ ล่าสุด</h3>
            <p className='text-xs text-slate-400 mt-0.5'>5 รายการล่าสุด</p>
          </div>
          <AdminTableContainer>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow className='bg-slate-50 border-b border-slate-100'>
                  <AdminTableHead>
                    RFQ ID
                  </AdminTableHead>
                  <AdminTableHead>
                    ผู้ซื้อ
                  </AdminTableHead>
                  <AdminTableHead>
                    สถานะ
                  </AdminTableHead>
                  <AdminTableHead>
                    วันที่
                  </AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody className='divide-y divide-slate-50'>
                {loading ? (
                  <TableSkeletonRows columns={4} rows={3} />
                ) : recentRfqs.length === 0 ? (
                  <AdminTableRow>
                    <AdminTableCell
                      colSpan={4}
                      className='px-4 py-10 text-center text-sm text-slate-400'
                    >
                      ไม่มีข้อมูล RFQ
                    </AdminTableCell>
                  </AdminTableRow>
                ) : (
                  recentRfqs.map((rfq) => {
                    const status = rfqStatusMeta(pickScalarString(rfq.status));
                    return (
                      <AdminTableRow
                        key={pickScalarString(rfq.rfq_id)}
                        className='hover:bg-slate-50 transition-colors'
                      >
                        <AdminTableCell className='px-4 py-3 font-mono text-xs text-purple-600 font-semibold'>
                          #{rfq.rfq_id}
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate'>
                          {rfq.customer_name ?? '-'}
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3'>
                          <AdminStatusBadge label={status.label} cls={status.cls} />
                        </AdminTableCell>
                        <AdminTableCell className='px-4 py-3 text-xs text-slate-400 tabular-nums'>
                          {pickScalarString(rfq.created_at, '-').slice(0, 10)}
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })
                )}
              </AdminTableBody>
            </AdminTable>
          </AdminTableContainer>
        </div>
      </div>
    </div>
  );
}
