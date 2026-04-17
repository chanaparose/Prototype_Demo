import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { rfqsApi } from '../../services/api';

function normalizeRfqRow(row: Record<string, unknown>): {
  id: string;
  title: string;
  status: string;
  budget: string;
  qty: string;
  categoryName: string;
  subCategoryName: string;
} {
  const inner = (row.rfq as Record<string, unknown>) ?? row;
  const id = String(inner.rfq_id ?? inner.id ?? row.rfq_id ?? row.id ?? '');
  const title = String(inner.title ?? inner.project_name ?? row.title ?? 'RFQ');
  const status = String(inner.status ?? row.status ?? '').toUpperCase();
  const budget = inner.budget_per_piece != null ? String(inner.budget_per_piece) : '—';
  const qty = inner.quantity != null ? String(inner.quantity) : '—';
  const categoryName = String(
    inner.category_name ?? row.category_name ?? '',
  ).trim();
  const subCategoryName = String(
    inner.sub_category_name ?? row.sub_category_name ?? '',
  ).trim();
  return { id, title, status, budget, qty, categoryName, subCategoryName };
}

export function FactoryRfqBoardPage() {
  const [rows, setRows] = useState<ReturnType<typeof normalizeRfqRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const raw = await rfqsApi.matching();
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const normalized = arr.map(normalizeRfqRow).filter((r) => r.id);
        if (!cancelled) setRows(normalized);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลด RFQ ไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">กระดาน RFQ</p>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">คำขอที่เปิดรับ</h1>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
        คำขอที่ตรงกับหมวดหมู่ของโรงงานคุณ — จาก <code className="text-[11px] bg-gray-100 px-1 rounded">GET /rfqs/matching</code>
      </p>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      ) : null}
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">
            ไม่มี RFQ ที่ตรงกับหมวดของโรงงานในขณะนี้
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link
                to={`/factory/rfqs/${r.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 hover:shadow-sm transition-shadow min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">#{r.id}</p>
                  <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.subCategoryName
                      ? `${r.subCategoryName} · `
                      : r.categoryName
                        ? `${r.categoryName} · `
                        : ''}
                    งบ/ชิ้น {r.budget} · จำนวน {r.qty}
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
