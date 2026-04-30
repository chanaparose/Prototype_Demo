import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { ArrowLeft, User, AlertTriangle } from 'lucide-react';
import {
  adminCustomerApi,
  type AdminCustomerDetail,
  type AdminCustomerWallet,
  type AdminWalletTxItem,
  type AdminCustomerOrderItem,
} from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCurrency(n: number) {
  return `฿${Number(n || 0).toLocaleString('th-TH')}`;
}

function formatDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Tx type / status helpers ────────────────────────────────────────────────

const TX_TYPE: Record<string, { label: string; color: string; sign: '+' | '-' }> = {
  DP: { label: 'เติมเงิน',    color: 'emerald', sign: '+' },
  WD: { label: 'ถอนเงิน',    color: 'red',     sign: '-' },
  BU: { label: 'ชำระออเดอร์', color: 'red',     sign: '-' },
  SC: { label: 'Settlement',  color: 'blue',    sign: '+' },
  RF: { label: 'คืนเงิน',    color: 'blue',    sign: '+' },
};

const TX_STATUS: Record<string, { label: string; color: string }> = {
  ST: { label: 'รอดำเนินการ', color: 'amber' },
  PT: { label: 'สำเร็จ',      color: 'emerald' },
  RJ: { label: 'ล้มเหลว',    color: 'red' },
};

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PD: { label: 'รอดำเนินการ', color: 'amber' },
  CF: { label: 'ยืนยันแล้ว',  color: 'blue' },
  PR: { label: 'ผลิตอยู่',    color: 'indigo' },
  SH: { label: 'จัดส่งแล้ว', color: 'purple' },
  CM: { label: 'เสร็จสิ้น',  color: 'emerald' },
  CA: { label: 'ยกเลิก',     color: 'red' },
};

function Badge({ label, color }: { label: string; color: string }) {
  const base = `inline-block px-2 py-0.5 rounded-full text-xs font-semibold`;
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    red:     'bg-red-50 text-red-700',
    blue:    'bg-blue-50 text-blue-700',
    amber:   'bg-amber-50 text-amber-700',
    indigo:  'bg-indigo-50 text-indigo-700',
    purple:  'bg-purple-50 text-purple-700',
    slate:   'bg-slate-100 text-slate-500',
  };
  return <span className={`${base} ${cls[color] ?? cls.slate}`}>{label}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = 'indigo',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const border: Record<string, string> = {
    indigo:  'border-indigo-200 bg-indigo-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber:   'border-amber-200 bg-amber-50',
    slate:   'border-slate-200 bg-slate-50',
  };
  const text: Record<string, string> = {
    indigo:  'text-indigo-700',
    emerald: 'text-emerald-700',
    amber:   'text-amber-700',
    slate:   'text-slate-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${border[color] ?? border.slate}`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${text[color] ?? text.slate}`}>{value}</p>
    </div>
  );
}

// ─── Tab: ข้อมูลทั่วไป ────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0 flex justify-between gap-4">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}

function CustomerInfoTab({ detail }: { detail: AdminCustomerDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="ออเดอร์ทั้งหมด" value={`${detail.total_orders} รายการ`} color="slate" />
        <StatCard label="ยอดซื้อรวม"     value={toCurrency(detail.total_spend)}   color="indigo" />
        <StatCard
          label="Wallet คงเหลือ"
          value={toCurrency(detail.good_fund + detail.pending_fund)}
          color="emerald"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">ข้อมูลโปรไฟล์</h3>
        <InfoRow label="User ID"     value={`#${detail.user_id}`} />
        <InfoRow label="Email"       value={detail.email} />
        <InfoRow label="ชื่อ-นามสกุล" value={`${detail.first_name} ${detail.last_name}`.trim()} />
        <InfoRow label="เบอร์โทร"    value={detail.phone ?? ''} />
        <InfoRow label="ที่อยู่"     value={detail.address ?? ''} />
        <InfoRow label="สมาชิกตั้งแต่" value={formatDate(detail.created_at)} />
        <InfoRow label="สถานะ"       value={detail.is_active ? 'Active' : 'Inactive'} />
      </div>
    </div>
  );
}

// ─── Tab: Wallet & ธุรกรรม ────────────────────────────────────────────────────

function CustomerWalletTab({ userId }: { userId: number }) {
  const [wallet, setWallet] = useState<AdminCustomerWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminCustomerApi
      .getWallet(userId)
      .then((res) => setWallet(res as unknown as AdminCustomerWallet))
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลด wallet ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
        <AlertTriangle size={15} />
        {error}
      </div>
    );
  }
  if (!wallet) return null;

  return (
    <div className="space-y-5">
      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="กองทุนพร้อมใช้" value={toCurrency(wallet.good_fund)}    color="emerald" />
        <StatCard label="รอยืนยัน"       value={toCurrency(wallet.pending_fund)} color="amber"   />
        <StatCard label="รวมทั้งหมด"     value={toCurrency(wallet.total)}        color="indigo"  />
      </div>

      {/* Transaction table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">ประวัติธุรกรรม</h3>
          <p className="text-xs text-slate-400 mt-0.5">200 รายการล่าสุด</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">วันที่</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">ประเภท</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">จำนวน</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {wallet.transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    ยังไม่มีธุรกรรม
                  </td>
                </tr>
              ) : (
                wallet.transactions.map((tx: AdminWalletTxItem) => {
                  const ttype = TX_TYPE[tx.type] ?? { label: tx.type, color: 'slate', sign: '+' as const };
                  const tstatus = TX_STATUS[tx.status] ?? { label: tx.status, color: 'slate' };
                  const amountCls =
                    ttype.sign === '+'
                      ? 'text-emerald-600 font-semibold'
                      : 'text-red-600 font-semibold';
                  return (
                    <tr key={tx.tx_id}>
                      <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={ttype.label} color={ttype.color} />
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${amountCls}`}>
                        {ttype.sign}{toCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge label={tstatus.label} color={tstatus.color} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: ประวัติออเดอร์ ──────────────────────────────────────────────────────

const ORDER_LIMIT = 10;

function CustomerOrdersTab({ userId }: { userId: number }) {
  const [orders, setOrders] = useState<AdminCustomerOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminCustomerApi
      .getOrders(userId, { limit: ORDER_LIMIT, offset: page * ORDER_LIMIT })
      .then((res) => {
        const data = res as unknown as { orders: AdminCustomerOrderItem[]; total: number };
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดออเดอร์ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [userId, page]);

  const totalPages = Math.ceil(total / ORDER_LIMIT);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
        <AlertTriangle size={15} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">โรงงาน</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">ยอดรวม</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">วันที่สั่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    ยังไม่มีออเดอร์
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const st = ORDER_STATUS[o.status] ?? { label: o.status, color: 'slate' };
                  return (
                    <tr key={o.order_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${o.order_id}`}
                          className="text-indigo-600 font-semibold font-mono text-xs hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{o.order_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[160px]">{o.factory_name}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {toCurrency(o.grand_total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge label={st.label} color={st.color} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">
                        {formatDate(o.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-sm text-slate-500">
            หน้า {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabKey = 'info' | 'wallet' | 'orders';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info',   label: 'ข้อมูลทั่วไป' },
  { key: 'wallet', label: 'Wallet & ธุรกรรม' },
  { key: 'orders', label: 'ประวัติออเดอร์' },
];

export function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('info');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    adminCustomerApi
      .getDetail(userId)
      .then((res) => setDetail(res as unknown as AdminCustomerDetail))
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดข้อมูลลูกค้าไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} />
          กลับ
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={15} />
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          กลับไปรายการลูกค้า
        </button>
        <p className="text-xs text-slate-400 font-medium">Admin / ลูกค้า / รายละเอียด</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {detail.first_name} {detail.last_name}
            </h2>
            <p className="text-sm text-slate-500">{detail.email} · #{detail.user_id}</p>
          </div>
          <div className="ml-auto">
            {detail.is_active ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'info'   && <CustomerInfoTab detail={detail} />}
      {tab === 'wallet' && <CustomerWalletTab userId={userId} />}
      {tab === 'orders' && <CustomerOrdersTab userId={userId} />}
    </div>
  );
}
