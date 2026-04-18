import React, { useEffect, useMemo, useState } from 'react';

type CertTypeOption = {
  id: number;
  label: string;
};

export type CertFormSubmitValue = {
  cert_id: number;
  cert_number?: string;
  expire_date: string;
  file: File | null;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  certTypes: CertTypeOption[];
  initial?: Record<string, unknown> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (value: CertFormSubmitValue, keepOpen: boolean) => Promise<void>;
};

function toDateInputValue(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function isFutureOrToday(raw: string): boolean {
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

export function CertUploadModal({
  open,
  mode,
  certTypes,
  initial,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const fallbackCertId = useMemo(() => certTypes[0]?.id ?? 1, [certTypes]);
  const [certId, setCertId] = useState(String(fallbackCertId));
  const [certNumber, setCertNumber] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const rawCertId = Number(initial?.certificate_id ?? initial?.cert_id ?? fallbackCertId);
    setCertId(String(Number.isFinite(rawCertId) && rawCertId > 0 ? rawCertId : fallbackCertId));
    setCertNumber(String(initial?.cert_number ?? '').trim());
    setExpireDate(toDateInputValue(initial?.expire_date));
    setFile(null);
    setError('');
  }, [open, initial, fallbackCertId]);

  if (!open) return null;

  const validate = (requireFile: boolean): string | null => {
    const idNum = Number(certId);
    if (!Number.isFinite(idNum) || idNum <= 0) return 'กรุณาเลือกประเภทใบรับรอง';
    if (!expireDate) return 'กรุณาเลือกวันหมดอายุ';
    if (!isFutureOrToday(expireDate)) return 'วันหมดอายุต้องเป็นวันนี้หรืออนาคต';
    if (requireFile && !file) return 'กรุณาอัปโหลดไฟล์เอกสาร';
    return null;
  };

  const submit = async (keepOpen: boolean) => {
    const requireFile = mode === 'create';
    const err = validate(requireFile);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    await onSubmit(
      {
        cert_id: Number(certId),
        cert_number: certNumber.trim() || undefined,
        expire_date: expireDate,
        file,
      },
      keepOpen,
    );
    if (mode === 'create' && keepOpen) {
      setCertNumber('');
      setExpireDate('');
      setFile(null);
      setCertId(String(fallbackCertId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-modal>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[min(90vh,100dvh)] overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'เพิ่มใบรับรอง' : 'แก้ไขใบรับรอง'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
            disabled={submitting}
          >
            ปิด
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        ) : null}

        <label className="block">
          <span className="text-xs text-gray-500">ประเภทใบรับรอง *</span>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
          >
            {certTypes.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">เลขที่เอกสาร (ถ้ามี)</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">วันหมดอายุ *</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">
            ไฟล์เอกสาร {mode === 'create' ? '*' : '(อัปโหลดใหม่หากต้องการแทนไฟล์เดิม)'}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="mt-1 text-sm block w-full"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? <p className="text-[11px] text-gray-500 mt-1">{file.name}</p> : null}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit(false)}
            className="py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          {mode === 'create' ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit(true)}
              className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              บันทึกและเพิ่มใบรับรองถัดไป
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
