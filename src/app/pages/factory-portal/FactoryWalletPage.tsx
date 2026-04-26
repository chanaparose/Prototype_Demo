import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { walletApi, transactionsApi } from '../../services/api';
import { FactoryPageHeader } from './components/FactoryPageHeader';

type TxRow = Record<string, unknown>;

function normTx(r: TxRow) {
  return {
    id: String(r.transaction_id ?? r.id ?? ''),
    type: String(r.type ?? r.transaction_type ?? ''),
    amount: Number(r.amount ?? 0),
    status: String(r.status ?? ''),
    date: String(r.created_at ?? r.date ?? ''),
  };
}

function txIcon(type: string): { emoji: string; bg: string } {
  const t = type.toLowerCase();
  if (t.includes('withdraw') || t.includes('out') || t.includes('debit')) {
    return { emoji: '↑', bg: 'rgba(239,68,68,0.1)' };
  }
  if (t.includes('refund')) {
    return { emoji: '↩', bg: 'rgba(234,179,8,0.12)' };
  }
  return { emoji: '↓', bg: 'rgba(16,185,129,0.12)' };
}

function isCredit(type: string): boolean {
  const t = type.toLowerCase();
  return !(t.includes('withdraw') || t.includes('out') || t.includes('debit'));
}

export function FactoryWalletPage() {
  const [good, setGood] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [tx, setTx] = useState<ReturnType<typeof normTx>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const w = (await walletApi.getMe()) as Record<string, unknown>;
      setGood(Number(w.good_fund ?? w.walletBalance ?? 0));
      setPending(Number(w.pending_fund ?? w.pendingBalance ?? 0));

      let raw: unknown;
      try {
        raw = await walletApi.transactions();
      } catch {
        raw = await transactionsApi.list().catch(() => []);
      }
      const arr = (Array.isArray(raw) ? raw : []) as TxRow[];
      setTx(arr.map(normTx).filter((t) => t.id).slice(0, 30));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดกระเป๋าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <FactoryPageHeader title="กระเป๋าเงิน" subtitle="Factory Portal" icon={Wallet} />
        <div className="flex justify-center py-16">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FactoryPageHeader title="กระเป๋าเงิน" subtitle="Factory Portal" icon={Wallet} />
      <div className="max-w-3xl space-y-4 w-full min-w-0">
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        ) : null}

        {/* Wallet hero card — teal gradient */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #065F46 0%, #0D9488 100%)' }}
        >
          <div
            className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-30 blur-2xl"
            style={{ backgroundColor: '#34D399' }}
          />
          <div className="relative z-10">
            <p className="text-sm opacity-80 mb-1">ยอดเงินคงเหลือ (good_fund)</p>
            <p className="text-3xl font-bold">
              ฿{(good ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs opacity-70 mt-1">
              รอดำเนินการ (pending_fund): ฿{(pending ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="py-3 rounded-xl text-white font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, #E38844 0%, #C96D1A 100%)',
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            ถอนเงิน
          </button>
          <button
            type="button"
            className="py-3 rounded-xl font-semibold text-sm border-2"
            style={{ borderColor: '#7A4B94', color: '#7A4B94' }}
          >
            ประวัติ
          </button>
        </div>

        {/* PromptPay notice */}
        <div
          className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950"
          role="status"
        >
          <p className="font-semibold mb-1">เติมเงิน / ถอนเงิน (PromptPay)</p>
          <p className="text-xs text-violet-900/90 leading-relaxed">
            ฟลว์ PromptPay (QR เติมเงินและคำขอถอน) กำลังพัฒนา — ช่วงนี้ดูยอดและประวัติธุรกรรมด้านล่างได้จาก API ที่มีอยู่
          </p>
        </div>

        {/* Transaction list */}
        <section className="min-w-0">
          <h2
            className="font-bold text-base mb-3"
            style={{ color: '#2E2252' }}
          >
            ธุรกรรมล่าสุด
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            จาก{' '}
            <code className="text-[11px] bg-gray-100 px-1 rounded">GET /wallets/me/transactions</code>
            {' '}(หรือ <code className="text-[11px] bg-gray-100 px-1 rounded">GET /transactions</code> ถ้า endpoint แรกยังไม่พร้อม)
          </p>
          <ul className="space-y-2.5">
            {tx.length === 0 ? (
              <li className="text-sm text-gray-400 text-center py-8">ไม่มีรายการ</li>
            ) : (
              tx.map((t) => {
                const { emoji, bg } = txIcon(t.type);
                const credit = isCredit(t.type);
                return (
                  <li
                    key={t.id}
                    className="rounded-xl bg-white border border-gray-100 p-3.5 flex items-center gap-3"
                  >
                    <div
                      className="rounded-xl p-2 w-10 h-10 flex items-center justify-center shrink-0 text-base font-bold"
                      style={{ backgroundColor: bg }}
                    >
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.type || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {t.status}
                        {t.date ? ` · ${t.date}` : ''}
                      </p>
                    </div>
                    <span
                      className="font-bold text-sm shrink-0"
                      style={{ color: credit ? '#059669' : '#DC2626' }}
                    >
                      {credit ? '+' : '-'}฿{t.amount.toLocaleString('th-TH')}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
