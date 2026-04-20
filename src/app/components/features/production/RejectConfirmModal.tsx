import React, { useState } from 'react';
import { productionErrorMessage } from './productionErrors';

type Props = {
  open: boolean;
  stepNameTh: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function RejectConfirmModal({ open, stepNameTh, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    const t = reason.trim();
    if (t.length < 10) {
      setErr('กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onConfirm(t);
      setReason('');
      onClose();
    } catch (e) {
      setErr(productionErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal
      aria-labelledby="reject-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <h2 id="reject-title" className="text-base font-bold text-gray-900">
          ขอตรวจสอบใหม่ — {stepNameTh}
        </h2>
        <p className="text-sm text-gray-600">
          คุณต้องการให้โรงงานตรวจสอบขั้นตอนนี้ใหม่ใช่ไหม?
          <br />
          โปรดระบุเหตุผล (อย่างน้อย 10 ตัวอักษร)
        </p>
        <textarea
          className="w-full min-h-[100px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          placeholder="เช่น ภาพไม่ชัด — กรุณาถ่ายใหม่"
        />
        {err ? <p className="text-xs text-red-600">{err}</p> : null}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
            disabled={busy}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: '#A238FF' }}
          >
            {busy ? 'กำลังส่ง…' : 'ยืนยันการขอตรวจสอบ'}
          </button>
        </div>
      </div>
    </div>
  );
}
