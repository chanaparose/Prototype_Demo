import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { mediaApi } from '../../../services/api';
import type { MergedProductionStep } from './types';
import { productionErrorMessage } from './productionErrors';

type Props = {
  open: boolean;
  placement: 'right' | 'bottom';
  step: MergedProductionStep | null;
  onClose: () => void;
  /** Submit production update (IP or CD). */
  onSubmit: (
    body: {
      step_id: number;
      status: 'IP' | 'CD';
      description?: string;
      image_urls: string[];
      confirm_payment_trigger?: boolean;
    },
    opts?: { confirmPaymentTriggerHeader?: boolean },
  ) => Promise<void>;
};

export function UpdateStepDrawer({ open, placement, step, onClose, onSubmit }: Props) {
  const [notes, setNotes] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !step) return;
    setNotes(String(step.update.description ?? '').slice(0, 500));
    setUrls([...(step.update.image_urls ?? [])].slice(0, 5));
    setErr('');
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const minPhotos = 1;
  const isPayment = Boolean(step?.template.is_payment_trigger);

  const addFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErr('');
    try {
      const next = [...urls];
      for (let i = 0; i < files.length && next.length < 5; i++) {
        const up = await mediaApi.upload(files[i]);
        const raw = typeof up.url === 'string' ? up.url.trim() : '';
        if (/^https?:\/\//i.test(raw)) next.push(raw);
      }
      setUrls(next.slice(0, 5));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }, [urls]);

  const removeAt = (idx: number) => {
    setUrls((u) => u.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setUrls((u) => {
      const j = idx + dir;
      if (j < 0 || j >= u.length) return u;
      const c = [...u];
      const t = c[idx];
      c[idx] = c[j];
      c[j] = t;
      return c;
    });
  };

  const saveDraft = async () => {
    if (!step) return;
    setBusy(true);
    setErr('');
    try {
      await onSubmit({
        step_id: step.template.step_id,
        status: 'IP',
        description: notes.trim() || undefined,
        image_urls: urls,
      });
      onClose();
    } catch (e) {
      setErr(productionErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDone = async () => {
    if (!step) return;
    if (urls.length < minPhotos) {
      setErr(`ต้องแนบภาพอย่างน้อย ${minPhotos} ภาพ`);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onSubmit(
        {
          step_id: step.template.step_id,
          status: 'CD',
          description: notes.trim() || undefined,
          image_urls: urls,
          confirm_payment_trigger: isPayment ? true : undefined,
        },
        { confirmPaymentTriggerHeader: isPayment },
      );
      onClose();
    } catch (e) {
      setErr(productionErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open || !step) return null;

  const sheet =
    placement === 'bottom'
      ? 'fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl'
      : 'fixed right-0 top-0 h-full w-full max-w-[480px] rounded-none sm:rounded-l-2xl';

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="ปิดแผง"
        onClick={onClose}
      />
      <div
        className={`absolute bg-white shadow-2xl flex flex-col ${sheet}`}
        role="dialog"
        aria-modal
        aria-labelledby="drawer-title"
      >
        {placement === 'bottom' ? (
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        ) : null}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 id="drawer-title" className="text-sm font-bold text-gray-900 pr-2">
            อัปเดต — {step.template.step_name_th}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {err ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>
          ) : null}

          <label className="block">
            <span className="text-xs text-gray-500">หมายเหตุ</span>
            <textarea
              className="mt-1 w-full min-h-[88px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น วัตถุดิบล็อตแรกมาถึงแล้ว รอรอบสอง"
            />
            <div className="text-xs text-gray-500 mt-0.5">{notes.length}/500</div>
          </label>

          <div>
            <span className="text-xs text-gray-500">ภาพหลักฐาน (สูงสุด 5)</span>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-3 gap-2">
              {urls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                    aria-label="ลบภาพ"
                    onClick={() => removeAt(idx)}
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    <button
                      type="button"
                      className="px-1 text-[10px] bg-white/90 rounded"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-1 text-[10px] bg-white/90 rounded"
                      onClick={() => move(idx, 1)}
                      disabled={idx === urls.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
              {urls.length < 5 ? (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <Plus size={22} className="text-gray-400" />
                  <span className="text-[10px] text-gray-500 mt-1">เพิ่ม</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    capture={placement === 'bottom' ? 'environment' : undefined}
                    onChange={(e) => void addFiles(e.target.files)}
                    disabled={uploading}
                  />
                </label>
              ) : null}
            </div>
            <p
              className={`text-xs mt-2 ${urls.length >= minPhotos ? 'text-emerald-600' : 'text-amber-700'}`}
            >
              {urls.length >= minPhotos
                ? `${urls.length}/${minPhotos} ภาพขั้นต่ำ ✓`
                : `ต้องการอย่างน้อย ${minPhotos} ภาพ`}
            </p>
            {uploading ? <p className="text-xs text-gray-500">กำลังอัปโหลด…</p> : null}
          </div>

        </div>

        <div className="shrink-0 border-t border-gray-100 p-4 space-y-2 bg-white">
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveDraft()}
            className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 disabled:opacity-50"
          >
            บันทึกร่าง
          </button>
          <button
            type="button"
            disabled={
              busy ||
              urls.length < minPhotos
            }
            onClick={() => void confirmDone()}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            ยืนยันว่าเสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
