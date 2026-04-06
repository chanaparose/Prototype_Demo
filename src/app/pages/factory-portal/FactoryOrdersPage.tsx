import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { ordersApi } from '../../services/api';

function orderFactoryId(row: Record<string, unknown>): number | null {
  const n = Number(row.factory_id ?? row.factoryId);
  return Number.isFinite(n) ? n : null;
}

function normOrder(row: Record<string, unknown>) {
  const inner = (row.order as Record<string, unknown>) ?? row;
  const id = String(inner.order_id ?? inner.id ?? row.order_id ?? row.id ?? '');
  const title = String(inner.title ?? inner.project_name ?? row.project_name ?? `Order #${id}`);
  const status = String(inner.status ?? row.status ?? '').toUpperCase();
  return { id, title, status, raw: row };
}

const STATUS_LABEL: Record<string, string> = {
  PR: 'กำลังผลิต',
  QC: 'ตรวจสอบคุณภาพ',
  SH: 'จัดส่งแล้ว',
  CP: 'สำเร็จ',
};

export function FactoryOrdersPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [rows, setRows] = useState<ReturnType<typeof normOrder>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const raw = await ordersApi.list();
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const normalized = arr.map(normOrder).filter((r) => r.id);
        const mine = fid
          ? normalized.filter((r) => orderFactoryId(r.raw) === fid)
          : normalized;
        if (!cancelled) setRows(mine);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลดออเดอร์ไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fid]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0 pb-6 sm:pb-8">
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">คำสั่งซื้อ</p>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">ออเดอร์ของโรงงาน</h1>
      </div>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      ) : null}
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">
            ไม่มีคำสั่งซื้อสำหรับโรงงานนี้
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link
                to={`/factory/orders/${r.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 hover:shadow-sm transition-shadow min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">#{r.id}</p>
                  <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#A238FF' }}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </p>
                </div>
                <ChevronRight className="text-gray-300 shrink-0" size={22} />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
