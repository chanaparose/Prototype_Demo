import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { profileApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { formatDateTime } from '@/utils/formatting/formatDate';

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
    <div className='flex min-h-screen flex-col bg-white pb-20'>
      {/* Header - Match FavoriteShowcasesPage style */}
      <div className='flex items-center justify-between px-4 pb-3 pt-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={22} className='text-gray-700' />
        </Button>
        <div className='flex flex-col items-center'>
          <p className='text-[10px] text-gray-400'>บัญชี</p>
          <h1 className='text-[13px] text-gray-900 font-bold'>ประวัติธุรกรรม</h1>
        </div>
        <div className='h-10 w-10' aria-hidden />
      </div>

      <div className='flex-1 px-4 py-3'>
        {/* Search Input */}
        <div className='relative mb-4'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-slate-400' />
          </div>
          <Input
            type='text'
            placeholder='ค้นหารายการ...'
            className='block w-full rounded-xl border border-slate-100 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple'
          />
        </div>

        {/* Summary Cards */}
        <div className='mb-4 grid grid-cols-3 gap-2'>
          <div className='rounded-lg border border-slate-100 bg-white p-3 text-center'>
            <p className='text-[10px] text-slate-500 font-semibold'>เงินเข้า</p>
            <p className='text-sm font-bold text-green-600 mt-1'>
              {formatCurrencyNoDecimals(Number(summary.total_in ?? 0))}
            </p>
          </div>
          <div className='rounded-lg border border-slate-100 bg-white p-3 text-center'>
            <p className='text-[10px] text-slate-500 font-semibold'>เงินออก</p>
            <p className='text-sm font-bold text-red-600 mt-1'>
              {formatCurrencyNoDecimals(Number(summary.total_out ?? 0))}
            </p>
          </div>
          <div className='rounded-lg border border-slate-100 bg-white p-3 text-center'>
            <p className='text-[10px] text-slate-500 font-semibold'>สุทธิ</p>
            <p className='text-sm font-bold text-slate-900 mt-1'>
              {formatCurrencyNoDecimals(Number(summary.net ?? 0))}
            </p>
          </div>
        </div>

        {/* Item Count */}
        <div className='mb-3 flex items-center justify-end'>
          <span className='text-[11px] text-slate-400'>{items.length} รายการ</span>
        </div>

        {/* Transaction List */}
        <div className='space-y-2'>
          {loading ? (
            <div className='py-8 text-center'>
              <p className='text-sm text-slate-500'>กำลังโหลด...</p>
            </div>
          ) : items.length === 0 ? (
            <div className='py-12 text-center text-sm text-slate-500'>
              ยังไม่มีรายการ
            </div>
          ) : (
            items.map((t) => (
              <div
                key={t.id}
                className='rounded-lg border border-slate-100 bg-white px-4 py-3 flex items-center gap-3'
              >
                <div className='shrink-0'>
                  {t.direction === 'in' ? (
                    <ArrowDownLeft size={16} className='text-green-600' />
                  ) : (
                    <ArrowUpRight size={16} className='text-red-600' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-slate-800 truncate font-medium'>{t.description}</p>
                  <p className='text-[11px] text-slate-500'>
                    {t.status_label} · {t.created_at ? formatDateTime(t.created_at) : '-'}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold whitespace-nowrap ${t.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {t.direction === 'in' ? '+' : '-'}
                  {formatCurrency(Math.abs(t.amount))}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {items.length > 0 && (
          <div className='flex justify-center mt-4'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setPage((p) => p + 1)}
              className='px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-semibold transition-colors hover:bg-slate-50'
            >
              โหลดเพิ่ม
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
