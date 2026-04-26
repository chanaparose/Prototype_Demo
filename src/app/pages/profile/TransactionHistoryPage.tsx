import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { profileApi } from '../../services/api';

type TxItem = {
  id: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  status_label: string;
  created_at: string;
};

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void profileApi.transactions({ page, limit: 20, type: 'all' }).then((raw) => {
      if (!mounted) return;
      const data = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
      setItems(
        data.map((row) => ({
          id: String(row.tx_id ?? row.transaction_id ?? row.id ?? ''),
          description: String(row.description ?? row.type_label ?? row.type ?? 'รายการ'),
          amount: Number(row.amount ?? 0),
          direction: String(row.direction ?? '').toLowerCase() === 'in' ? 'in' : 'out',
          status_label: String(row.status_label ?? row.status ?? '-'),
          created_at: String(row.created_at ?? row.date ?? ''),
        })).filter((r) => r.id),
      );
      setSummary((raw.summary as Record<string, number>) ?? {});
    }).finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [page]);

  return (
    <div className="space-y-4 pb-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="text-slate-600"><ChevronLeft size={18} /></button>
        <p className="text-sm font-bold text-slate-900">ประวัติธุรกรรม</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] text-slate-500">เงินเข้า</p><p className="text-sm font-bold text-emerald-700">฿{Number(summary.total_in ?? 0).toLocaleString('th-TH')}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] text-slate-500">เงินออก</p><p className="text-sm font-bold text-red-600">฿{Number(summary.total_out ?? 0).toLocaleString('th-TH')}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] text-slate-500">สุทธิ</p><p className="text-sm font-bold text-slate-900">฿{Number(summary.net ?? 0).toLocaleString('th-TH')}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {loading ? <p className="text-sm text-slate-500">กำลังโหลด...</p> : (
          <ul className="space-y-2">
            {items.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.direction === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {t.direction === 'in' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{t.description}</p>
                  <p className="text-[11px] text-slate-500">{t.status_label} · {t.created_at ? new Date(t.created_at).toLocaleString('th-TH') : '-'}</p>
                </div>
                <p className={`text-sm font-semibold ${t.direction === 'in' ? 'text-emerald-700' : 'text-red-600'}`}>{t.direction === 'in' ? '+' : '-'}฿{Math.abs(t.amount).toLocaleString('th-TH')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700">โหลดเพิ่ม</button>
      </div>
    </div>
  );
}
