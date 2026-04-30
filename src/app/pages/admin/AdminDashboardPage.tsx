import React, { useEffect, useMemo, useState } from 'react';
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
import {
  adminApi,
  adminCustomerApi,
  type AdminOrderRow,
  type AdminRfqRow,
  type AdminRevenueChartResponse,
  type AdminTopCustomer,
} from '../../services/api';

interface KpiCard {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

interface ChartRow {
  month: string;
  revenue: number;
  commission: number;
}

function parseRows<T extends Record<string, unknown>>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function toCurrency(value: number): string {
  return `฿${Number(value || 0).toLocaleString('th-TH')}`;
}

function orderStatusMeta(status: string): { label: string; cls: string } {
  const s = String(status || '').toUpperCase();
  if (s === 'CM' || s === 'DONE' || s === 'COMPLETED') return { label: 'เสร็จสิ้น', cls: 'bg-emerald-100 text-emerald-700' };
  if (s === 'CL' || s === 'CANCELLED') return { label: 'ยกเลิก', cls: 'bg-red-100 text-red-700' };
  if (s === 'OP' || s === 'PENDING' || s === 'PD') return { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'กำลังดำเนินการ', cls: 'bg-blue-100 text-blue-700' };
}

function rfqStatusMeta(status: string): { label: string; cls: string } {
  const s = String(status || '').toUpperCase();
  if (s === 'CL' || s === 'CC') return { label: 'ปิด', cls: 'bg-slate-100 text-slate-500' };
  if (s === 'MT' || s === 'MATCHED') return { label: 'จับคู่แล้ว', cls: 'bg-blue-100 text-blue-700' };
  return { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' };
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

function TopCustomersWidget() {
  const [topCustomers, setTopCustomers] = useState<AdminTopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminCustomerApi
      .topCustomers(5)
      .then((res) => {
        const data = res as unknown as { top_customers: AdminTopCustomer[] };
        setTopCustomers(data.top_customers ?? []);
      })
      .catch(() => {/* silent — non-critical widget */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Top 5 ลูกค้า</h3>
          <p className="text-xs text-slate-400 mt-0.5">ยอดซื้อสูงสุด</p>
        </div>
        <Link to="/admin/customers" className="text-xs text-indigo-600 hover:underline font-medium">
          ดูทั้งหมด →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-20 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : topCustomers.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีข้อมูล</p>
      ) : (
        <ol className="space-y-3">
          {topCustomers.map((c, i) => (
            <li key={c.user_id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-slate-400 shrink-0">{i + 1}</span>
              <Link
                to={`/admin/customers/${c.user_id}`}
                className="flex-1 min-w-0 hover:text-indigo-600 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900 truncate">
                  {c.first_name} {c.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
              </Link>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-indigo-700">
                  ฿{Number(c.total_spend || 0).toLocaleString('th-TH')}
                </p>
                <p className="text-xs text-slate-400">{c.total_orders} ออเดอร์</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [revenueRows, setRevenueRows] = useState<ChartRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrderRow[]>([]);
  const [recentRfqs, setRecentRfqs] = useState<AdminRfqRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryRaw, revenueRaw, ordersRaw, rfqsRaw] = await Promise.all([
          adminApi.dashboardSummary(),
          adminApi.dashboardRevenueChart(),
          adminApi.listOrders({ page: 1, page_size: 5 }),
          adminApi.listRfqs({ page: 1, page_size: 5 }),
        ]);
        if (cancelled) return;

        setSummary(summaryRaw as Record<string, unknown>);

        const revenueObj = (revenueRaw && typeof revenueRaw === 'object'
          ? (revenueRaw as AdminRevenueChartResponse)
          : null);
        const sourceRows =
          revenueObj && Array.isArray(revenueObj.data)
            ? revenueObj.data
            : parseRows<Record<string, unknown>>(revenueRaw);
        const chartRows = sourceRows.map((r) => ({
          month: String((r as Record<string, unknown>).month ?? (r as Record<string, unknown>).date ?? (r as Record<string, unknown>).period ?? (r as Record<string, unknown>).label ?? '-'),
          revenue: Number((r as Record<string, unknown>).revenue ?? (r as Record<string, unknown>).gross_order_value ?? 0),
          commission: Number((r as Record<string, unknown>).commission ?? (r as Record<string, unknown>).platform_commission ?? 0),
        }));
        setRevenueRows(chartRows.slice(-6));

        setRecentOrders(parseRows<AdminOrderRow>(ordersRaw).slice(0, 5));
        setRecentRfqs(parseRows<AdminRfqRow>(rfqsRaw).slice(0, 5));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpiData = useMemo<KpiCard[]>(() => {
    const gross = Number(summary.gross_order_value ?? summary.total_revenue ?? 0);
    const commission = Number(summary.platform_commission ?? summary.platform_commission_amount ?? 0);
    const vat = Number(summary.vat_collected ?? summary.vat_amount ?? 0);
    const totalOrders = Number(summary.total_orders ?? summary.order_count ?? recentOrders.length);
    const totalRfqs = Number(summary.total_rfqs ?? summary.new_rfqs ?? recentRfqs.length);
    const pendingFactories = Number(summary.pending_factory_approvals ?? summary.pending_factories ?? 0);

    return [
      { label: 'รายได้รวม', value: toCurrency(gross), icon: TrendingUp, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { label: 'ค่าคอมมิชชัน', value: toCurrency(commission), icon: BadgePercent, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
      { label: 'VAT รวม', value: toCurrency(vat), icon: Receipt, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
      { label: 'คำสั่งซื้อทั้งหมด', value: totalOrders.toLocaleString('th-TH'), icon: ShoppingCart, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'RFQ ใหม่', value: totalRfqs.toLocaleString('th-TH'), icon: ClipboardList, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      { label: 'โรงงานรอ Approve', value: pendingFactories.toLocaleString('th-TH'), icon: Factory, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    ];
  }, [summary, recentOrders.length, recentRfqs.length]);

  const orderStatusData = useMemo(() => {
    const counts = { completed: 0, processing: 0, pending: 0, cancelled: 0 };
    recentOrders.forEach((o) => {
      const s = String(o.status ?? '').toUpperCase();
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
    <div className="space-y-8">
      <div>
        <p className="text-xs text-slate-400 font-medium">Admin / แดชบอร์ด</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">ภาพรวมระบบ</h2>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((card) => {
          const Icon = card.icon;
          const isUp = typeof card.change === 'number' ? card.change > 0 : null;
          const isFlat = card.change === 0;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
              <p className="text-lg font-bold text-slate-900 leading-none">{loading ? '...' : card.value}</p>
              {typeof card.change === 'number' && !isFlat ? (
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(card.change)}% vs เดือนที่แล้ว
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">รายได้ & ค่าคอมมิชชัน</h3>
          <p className="text-xs text-slate-400 mb-5">6 เดือนย้อนหลัง (บาท)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueRows} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
              <Bar dataKey="revenue" name="รายได้" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="ค่าคอม" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">สถานะคำสั่งซื้อ</h3>
          <p className="text-xs text-slate-400 mb-4">5 รายการล่าสุด</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={orderStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span style={{ fontSize: 11 }}>{value}</span>} />
              <Tooltip formatter={(value: number) => [value, 'คำสั่งซื้อ']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top factories + top customers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopCustomersWidget />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">คำสั่งซื้อล่าสุด</h3>
            <p className="text-xs text-slate-400 mt-0.5">5 รายการล่าสุด</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Order ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">ผู้ซื้อ</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">ยอดรวม</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <TableSkeleton cols={4} />
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">ไม่มีข้อมูลคำสั่งซื้อ</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const status = orderStatusMeta(String(order.status ?? ''));
                    return (
                      <tr key={String(order.order_id)} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">#{order.order_id}</td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-[120px] truncate">{order.customer_name ?? '-'}</td>
                        <td className="px-4 py-3 text-xs text-slate-900 font-semibold text-right tabular-nums">{toCurrency(Number(order.total_amount ?? 0))}</td>
                        <td className="px-4 py-3">
                          <StatusBadge label={status.label} cls={status.cls} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">RFQ ล่าสุด</h3>
            <p className="text-xs text-slate-400 mt-0.5">5 รายการล่าสุด</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">RFQ ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">ผู้ซื้อ</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">สถานะ</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <TableSkeleton cols={4} />
                ) : recentRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">ไม่มีข้อมูล RFQ</td>
                  </tr>
                ) : (
                  recentRfqs.map((rfq) => {
                    const status = rfqStatusMeta(String(rfq.status ?? ''));
                    return (
                      <tr key={String(rfq.rfq_id)} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">#{rfq.rfq_id}</td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate">{rfq.customer_name ?? '-'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge label={status.label} cls={status.cls} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{String(rfq.created_at ?? '-').slice(0, 10)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
