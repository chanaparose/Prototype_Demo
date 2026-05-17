import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { profileApi } from '@/services/api';
import { useAuth } from '@/stores';
import { Button } from '@/components/ui/button';

type TxItem = {
  id: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  status_label: string;
  created_at: string;
};

function mapTxDescription(row: Record<string, unknown>): string {
  const txType = String(row.type ?? row.transaction_type ?? '').toUpperCase();
  const refType = String(row.reference_type ?? '').toLowerCase();
  const refId = Number(row.reference_id ?? 0);
  if (txType === 'BU') {
    if (refType === 'order' && Number.isFinite(refId) && refId > 0)
      return `สั่งซื้อ Order #${refId}`;
    return 'สั่งซื้อ';
  }
  if (txType === 'DP') return 'มัดจำ';
  if (txType === 'WD') return 'ถอนเงิน';
  if (txType === 'SC') return 'รับเงิน';
  if (txType === 'RF') return 'คืนเงิน';
  return String(row.description ?? row.type_label ?? row.type ?? 'รายการ');
}

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(
    (user as { role?: unknown; user_type?: unknown } | null)?.role ??
      (user as { user_type?: unknown } | null)?.user_type ??
      '',
  ).toUpperCase();
  const isCustomer = role === 'CT' || role === 'CUSTOMER';
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void profileApi
      .transactions({ page, limit: 20, type: 'all' })
      .then((raw) => {
        if (!mounted) return;
        const data = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
        setItems(
          data
            .map((row) => {
              // Customer BU is spending (negative) even if API direction says "in".
              const txType = String(row.type ?? '').toUpperCase();
              const apiDir = String(row.direction ?? '').toLowerCase();
              const amount = Number(row.amount ?? 0);
              const effectiveDirection: 'in' | 'out' =
                amount < 0
                  ? 'out'
                  : amount > 0
                    ? 'in'
                    : isCustomer && txType === 'BU'
                      ? 'out'
                      : apiDir === 'in'
                        ? 'in'
                        : 'out';
              return {
                id: String(row.tx_id ?? row.transaction_id ?? row.id ?? ''),
                description: mapTxDescription(row),
                amount,
                direction: effectiveDirection,
                status_label: String(row.status_label ?? row.status ?? '-'),
                created_at: String(row.created_at ?? row.date ?? ''),
              };
            })
            .filter((r) => r.id),
        );
        setSummary((raw.summary as Record<string, number>) ?? {});
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [page, isCustomer]);

  return (
    <div className='space-y-4 pb-24'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-slate-600'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-slate-900'>ประวัติธุรกรรม</p>
      </div>

      <div className='grid grid-cols-3 gap-2'>
        <div className='rounded-xl border border-slate-200 bg-white p-3'>
          <p className='text-[11px] text-slate-500'>เงินเข้า</p>
          <p className='text-sm font-bold text-emerald-700'>
            ฿{Number(summary.total_in ?? 0).toLocaleString('th-TH')}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-3'>
          <p className='text-[11px] text-slate-500'>เงินออก</p>
          <p className='text-sm font-bold text-red-600'>
            ฿{Number(summary.total_out ?? 0).toLocaleString('th-TH')}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-3'>
          <p className='text-[11px] text-slate-500'>สุทธิ</p>
          <p className='text-sm font-bold text-slate-900'>
            ฿{Number(summary.net ?? 0).toLocaleString('th-TH')}
          </p>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
        {loading ? (
          <p className='text-sm text-slate-500'>กำลังโหลด...</p>
        ) : (
          <ul className='space-y-2'>
            {items.map((t) => (
              <li
                key={t.id}
                className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2'
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.direction === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}
                >
                  {t.direction === 'in' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </span>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-slate-800 truncate'>{t.description}</p>
                  <p className='text-[11px] text-slate-500'>
                    {t.status_label} ·{' '}
                    {t.created_at ? new Date(t.created_at).toLocaleString('th-TH') : '-'}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.direction === 'in' ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {t.direction === 'in' ? '+' : '-'}฿{Math.abs(t.amount).toLocaleString('th-TH')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className='flex justify-center'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => setPage((p) => p + 1)}
          className='px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700'
        >
          โหลดเพิ่ม
        </Button>
      </div>
    </div>
  );
}
