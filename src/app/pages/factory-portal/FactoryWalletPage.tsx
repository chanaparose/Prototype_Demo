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

      const raw = await transactionsApi.list().catch(() => []);
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
      <div className="flex justify-center py-16">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-lg lg:max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-10 sm:pb-12">
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      ) : null}

      {/* TODO(BE): PromptPay — เติมเงิน/ถอนเงินผ่าน POST /wallet/topup-intents และ POST /withdrawals เมื่อ BE พร้อม */}
      <div
        className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950"
        role="status"
      >
        <p className="font-semibold mb-1">เติมเงิน / ถอนเงิน (PromptPay)</p>
        <p className="text-xs text-violet-900/90 leading-relaxed">
          ฟลว์ PromptPay (QR เติมเงินและคำขอถอน) กำลังพัฒนา — ช่วงนี้ดูยอดและประวัติธุรกรรมด้านล่างได้จาก API ที่มีอยู่
        </p>
      </div>

      <div
        className="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden min-h-[140px]"
        style={{
          background: 'linear-gradient(135deg, #6C47FF 0%, #8B5CF6 60%, #A78BFA 100%)',
        }}
      >
        <p className="text-xs opacity-90">เงินพร้อมถอน (good_fund)</p>
        <p className="text-xl sm:text-2xl font-bold mt-1 break-all">
          ฿{(good ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs mt-3 opacity-90">รอรับจาก escrow (pending_fund)</p>
        <p className="text-base sm:text-lg font-semibold break-all">
          ฿{(pending ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <section className="min-w-0">
        <h2 className="font-bold text-gray-900 mb-2">รายการเคลื่อนไหวล่าสุด</h2>
        <p className="text-xs text-gray-500 mb-3">
          จาก <code className="text-[11px] bg-gray-100 px-1 rounded">GET /transactions</code>
        </p>
        <ul className="space-y-2">
          {tx.length === 0 ? (
            <li className="text-sm text-gray-400">ไม่มีรายการ</li>
          ) : (
            tx.map((t) => (
              <li
                key={t.id}
                className="bg-white rounded-xl border border-gray-100 px-3 py-2 text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 min-w-0"
              >
                <span className="text-gray-600">
                  {t.type} · {t.status}
                  {t.date ? <span className="text-gray-400 text-xs ml-1">{t.date}</span> : null}
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
