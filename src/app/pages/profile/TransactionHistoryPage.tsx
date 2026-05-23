import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { profileApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import {
  mapProfileWalletHistoryTxList,
  type ProfileWalletHistoryTx,
} from '@/domain/wallet/mappers/mapProfileTransaction';
import { asRecord } from '@/lib/apiShape';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { formatDateTime } from '@/utils/formatting/formatDate';

type TxItem = ProfileWalletHistoryTx;

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
        setItems(mapProfileWalletHistoryTxList(raw, isCustomer));
        const sum = asRecord(raw.summary);
        if (Object.keys(sum).length > 0) {
          setSummary({
            total_in: Number(sum.total_in ?? 0),
            total_out: Number(sum.total_out ?? 0),
            net: Number(sum.net ?? 0),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
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
            {formatCurrencyNoDecimals(Number(summary.total_in ?? 0))}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-3'>
          <p className='text-[11px] text-slate-500'>เงินออก</p>
          <p className='text-sm font-bold text-red-600'>
            {formatCurrencyNoDecimals(Number(summary.total_out ?? 0))}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-3'>
          <p className='text-[11px] text-slate-500'>สุทธิ</p>
          <p className='text-sm font-bold text-slate-900'>
            {formatCurrencyNoDecimals(Number(summary.net ?? 0))}
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
                    {t.created_at ? formatDateTime(t.created_at) : '-'}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.direction === 'in' ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {t.direction === 'in' ? '+' : '-'}
                  {formatCurrency(Math.abs(t.amount))}
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