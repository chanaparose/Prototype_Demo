import React, { useState } from 'react';
import { ordersApi } from '../../../services/api';

type Props = {
  orderId: string;
  depositAmount: number;
  totalAmount: number;
  onVerified?: () => void;
};

function txIdFromRow(row: Record<string, unknown>): string {
  const id = row.tx_id ?? row.transaction_id ?? row.payment_id ?? row.id;
  return id != null ? String(id) : '';
}

/**
 * ขั้นตอนชำระมัดจำหลัง POST /orders (สถานะ PP) — ตาม PAYMENT_ORDER_FLOW / FE_ORDER_PAYMENT_ALIGNMENT
 * prototype: สร้าง DP แล้วกด verify (ไม่มีสลิปภายนอก)
 */
export function OrderPendingPaymentSection({
  orderId,
  depositAmount,
  totalAmount,
  onVerified,
}: Props) {
  const [createdTx, setCreatedTx] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return (
      <p className="text-sm text-amber-900 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
        ไม่พบยอดมัดจำจากระบบ — ติดต่อฝ่ายสนับสนุน
      </p>
    );
  }

  const createDp = async () => {
    setErr('');
    setBusy(true);
    try {
      const row = (await ordersApi.createPayment(orderId, {
        type: 'DP',
        amount: depositAmount,
      })) as Record<string, unknown>;
      setCreatedTx(row);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'สร้างรายการชำระไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const tid = createdTx ? txIdFromRow(createdTx) : '';
    if (!tid) return;
    setErr('');
    setBusy(true);
    try {
      await ordersApi.verifyPayment(orderId, tid);
      onVerified?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'ยืนยันการชำระไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
      <p className="text-sm font-bold text-amber-950">ชำระมัดจำเพื่อเริ่มงาน</p>
      <p className="text-xs text-amber-900/90 leading-relaxed">
        ออเดอร์รอชำระ (PP) — ใช้ <code className="text-[10px] bg-white/80 px-1 rounded">POST /orders/:id/payments</code> แล้ว{' '}
        <code className="text-[10px] bg-white/80 px-1 rounded">.../verify</code> เมื่อพร้อม
      </p>
      <p className="text-sm">
        ยอดมัดจำ: <strong>฿{depositAmount.toLocaleString('th-TH')}</strong>
        <span className="text-gray-600 text-xs ml-2">
          รวม ฿{Number(totalAmount || 0).toLocaleString('th-TH')}
        </span>
      </p>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      {!createdTx ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void createDp()}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          {busy ? 'กำลังสร้างรายการ…' : 'สร้างรายการชำระมัดจำ (DP)'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-amber-900">
            สร้างรายการแล้ว — tx_id: <span className="font-mono">{txIdFromRow(createdTx) || '—'}</span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void verify()}
            className="w-full py-3 rounded-xl border-2 border-amber-800 text-amber-950 text-sm font-semibold bg-white disabled:opacity-50"
          >
            {busy ? 'กำลังยืนยัน…' : 'ยืนยันการชำระ (verify)'}
          </button>
        </div>
      )}
    </div>
  );
}
