import React, { useEffect, useState } from 'react';
import { walletApi, transactionsApi } from '../../services/api';

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

export function FactoryWalletPage() {
  const [good, setGood] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [tx, setTx] = useState<ReturnType<typeof normTx>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const w = (await walletApi.getMe()) as Record<string, unknown>;
      setGood(Number(w.good_fund ?? w.walletBalance ?? 0));
      setPending(Number(w.pending_fund ?? w.pendingBalance ?? 0));
      setWalletId(Number(w.wallet_id ?? w.walletId));

      const raw = await transactionsApi.list();
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

  const withdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('กรอกจำนวนเงินที่ถอน (มากกว่า 0)');
      return;
    }
    if (walletId == null || !Number.isFinite(walletId)) {
      setError('ไม่พบ wallet_id — โหลดหน้าใหม่');
      return;
    }
    if (good != null && amt > good) {
      setError('ยอดถอนเกิน good_fund ที่มี');
      return;
    }
    setWithdrawing(true);
    setError('');
    setOkMsg('');
    try {
      await transactionsApi.create({
        wallet_id: walletId,
        type: 'WD',
        amount: amt,
      });
      setWithdrawAmount('');
      setOkMsg('ส่งคำขอถอนเงินแล้ว (รอดำเนินการตาม API)');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ถอนเงินไม่สำเร็จ');
    } finally {
      setWithdrawing(false);
    }
  };

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
    <div className="max-w-lg mx-auto space-y-6 pb-12">
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      ) : null}
      {okMsg ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">{okMsg}</p>
      ) : null}

      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6C47FF 0%, #8B5CF6 60%, #A78BFA 100%)',
        }}
      >
        <p className="text-xs opacity-90">เงินพร้อมถอน (good_fund)</p>
        <p className="text-2xl font-bold mt-1">
          ฿{(good ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs mt-3 opacity-90">รอรับจาก escrow (pending_fund)</p>
        <p className="text-lg font-semibold">
          ฿{(pending ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="font-bold text-gray-900">ถอนเงิน</h2>
        <p className="text-xs text-gray-500">
          ไม่กำหนดยอดขั้นต่ำ — ใช้{' '}
          <code className="text-[11px] bg-gray-100 px-1 rounded">POST /transactions</code> ประเภท WD
        </p>
        <label className="block">
          <span className="text-xs text-gray-500">จำนวนเงิน (บาท)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="กรอกจำนวน"
          />
        </label>
        <button
          type="button"
          disabled={withdrawing || (good ?? 0) <= 0}
          onClick={() => void withdraw()}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F28A2E 0%, #EA580C 100%)' }}
        >
          {withdrawing ? 'กำลังส่งคำขอ...' : 'ขอถอนเงิน'}
        </button>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-2">รายการล่าสุด</h2>
        <ul className="space-y-2">
          {tx.length === 0 ? (
            <li className="text-sm text-gray-400">ไม่มีรายการ</li>
          ) : (
            tx.map((t) => (
              <li
                key={t.id}
                className="bg-white rounded-xl border border-gray-100 px-3 py-2 text-sm flex justify-between gap-2"
              >
                <span className="text-gray-600">
                  {t.type} · {t.status}
                </span>
                <span className="font-semibold" style={{ color: '#2D1B4E' }}>
                  ฿{t.amount.toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
