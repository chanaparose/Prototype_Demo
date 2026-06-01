import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, ImageIcon, Truck, FileText, AlertTriangle, CreditCard } from 'lucide-react';
import { mediaApi } from '@/services/api/factoryApi';
import type { MergedProductionStep } from '@/components/features/production/types';
import { productionErrorMessage } from '@/components/features/production/productionErrors';
import { getStepGuide } from '@/components/features/production/stepGuideConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';

/** ข้อมูลที่อยู่จัดส่งลูกค้า — ส่งมาจาก order API */
export interface CustomerShippingInfo {
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

type Props = {
  open: boolean;
  placement: 'right' | 'bottom';
  step: MergedProductionStep | null;
  onClose: () => void;
  customerShipping?: CustomerShippingInfo;
  onSubmit: (
    body: {
      step_id: number;
      status: 'IP' | 'CD';
      description?: string;
      image_urls: string[];
      confirm_payment_trigger?: boolean;
      tracking_no?: string;
      courier?: string;
    },
    opts?: { confirmPaymentTriggerHeader?: boolean },
  ) => Promise<void>;
};

export function UpdateStepDrawer({ open, placement, step, onClose, onSubmit }: Props) {
  const [notes, setNotes] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [courier, setCourier] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const guide = step ? getStepGuide(Number(step.template.step_id ?? 0)) : null;
  const GuideIcon = guide?.icon;
  const stepId = step ? Number(step.template.step_id ?? -1) : -1;
  const isShippingStep = stepId === 4;
  const isPayment = Boolean(step?.template.is_payment_trigger);
  const minPhotos = 1;

  useEffect(() => {
    if (!open || !step) return;
    setNotes(String(step.update.description ?? '').slice(0, 500));
    setUrls([...(step.update.image_urls ?? [])].slice(0, 5));
    setErr('');
    const desc = String(step.update.description ?? '');
    const match = desc.match(/(?:tracking|เลขพัสดุ|เลขติดตาม)[:\s#]*([A-Z0-9\-]{6,})/i);
    setTrackingNo(match?.[1] ?? '');
    setCourier('');
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const removeAt = (idx: number) => setUrls((u) => u.filter((_, i) => i !== idx));

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
        ...(isShippingStep && trackingNo.trim() ? { tracking_no: trackingNo.trim() } : {}),
        ...(isShippingStep && courier.trim() ? { courier: courier.trim() } : {}),
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
    if (urls.length < minPhotos) { setErr(`ต้องแนบภาพหลักฐานอย่างน้อย ${minPhotos} ภาพ`); return; }
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
          ...(isShippingStep && trackingNo.trim() ? { tracking_no: trackingNo.trim() } : {}),
          ...(isShippingStep && courier.trim() ? { courier: courier.trim() } : {}),
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

  const isMobile = placement === 'bottom';

  return (
    <div className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center'>
      {/* Backdrop */}
      <button
        type='button'
        className='absolute inset-0 bg-black/50 backdrop-blur-[2px]'
        aria-label='ปิด'
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role='dialog'
        aria-modal
        aria-labelledby='modal-title'
        className={`
          relative bg-white w-full flex flex-col shadow-2xl
          ${isMobile
            ? 'rounded-t-3xl max-h-[92vh]'
            : 'rounded-2xl sm:max-w-lg sm:mx-4 max-h-[90vh]'
          }
        `}
      >
        {/* Pull handle (mobile only) */}
        {isMobile ? (
          <div className='flex justify-center pt-3 pb-1 shrink-0'>
            <div className='w-10 h-1 rounded-full bg-gray-200' />
          </div>
        ) : null}

        {/* ── Header ── */}
        <div className='shrink-0 px-5 py-4 border-b border-gray-100'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-3 min-w-0'>
              <div className='w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600'>
                {GuideIcon ? <GuideIcon size={19} /> : null}
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-0.5'>
                  อัปเดตขั้นตอน
                </p>
                <h2 id='modal-title' className='text-[15px] font-bold text-gray-900 leading-tight'>
                  {step.template.step_name_th}
                </h2>
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
              aria-label='ปิด'
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className='flex-1 overflow-y-auto'>
          <div className='px-5 py-4 space-y-5'>

            {/* Error */}
            {err ? (
              <div className='flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3'>
                <AlertTriangle size={15} className='text-red-500 shrink-0 mt-0.5' />
                <p className='text-sm text-red-700'>{err}</p>
              </div>
            ) : null}

            {/* Payment warning */}
            {isPayment ? (
              <div className='flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3'>
                <CreditCard size={16} className='mt-0.5 shrink-0 text-amber-700' />
                <p className='text-xs text-amber-800 leading-relaxed'>
                  <span className='font-semibold'>การยืนยันขั้นนี้</span>จะส่งคำขอชำระเงินส่วนที่เหลือให้ลูกค้าทันที
                </p>
              </div>
            ) : null}

            {/* ── Shipping fields ── */}
            {isShippingStep ? (
              <section>
                <div className='flex items-center gap-2 mb-3'>
                  <Truck size={14} className='text-orange-500' />
                  <h3 className='text-xs font-bold text-gray-700 uppercase tracking-wide'>ข้อมูลการจัดส่ง</h3>
                </div>
                <div className='space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5'>
                  <Label className='block'>
                    <span className='text-xs font-semibold text-gray-600 block mb-1.5'>เลข Tracking</span>
                    <Input
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      placeholder='เช่น TH123456789'
                      maxLength={100}
                      className='h-9 text-sm'
                    />
                  </Label>
                  <Label className='block'>
                    <span className='text-xs font-semibold text-gray-600 block mb-1.5'>บริษัทขนส่ง</span>
                    <Input
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      placeholder='เช่น Kerry, J&T, Flash, ไปรษณีย์ไทย'
                      maxLength={100}
                      className='h-9 text-sm'
                    />
                  </Label>
                </div>
              </section>
            ) : null}

            {/* ── Notes ── */}
            <section>
              <div className='flex items-center gap-2 mb-3'>
                <FileText size={14} className='text-indigo-400' />
                <h3 className='text-xs font-bold text-gray-700 uppercase tracking-wide'>หมายเหตุ / ความคืบหน้า</h3>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={guide?.notesPlaceholder ?? 'ระบุรายละเอียดความคืบหน้า...'}
                maxLength={500}
                rows={3}
                className='w-full text-sm resize-none'
              />
              <p className='text-[11px] text-gray-400 text-right mt-1'>{notes.length}/500</p>
            </section>

            {/* ── Photos ── */}
            <section>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <ImageIcon size={14} className='text-indigo-400' />
                  <h3 className='text-xs font-bold text-gray-700 uppercase tracking-wide'>ภาพหลักฐาน</h3>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  urls.length >= minPhotos
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {urls.length}/{minPhotos} ขั้นต่ำ {urls.length >= minPhotos ? '✓' : ''}
                </span>
              </div>
              <div className='grid grid-cols-4 gap-2'>
                {urls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className='relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50'
                  >
                    <Image src={url} alt='' className='w-full h-full object-cover' />
                    <button
                      type='button'
                      aria-label='ลบภาพ'
                      onClick={() => removeAt(idx)}
                      className='absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors'
                    >
                      ×
                    </button>
                  </div>
                ))}
                {urls.length < 5 ? (
                  <Label className='aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors'>
                    <Plus size={18} className='text-gray-400' />
                    <span className='text-[10px] text-gray-400 mt-1'>
                      {uploading ? 'กำลังอัปโหลด…' : 'เพิ่มภาพ'}
                    </span>
                    <Input
                      type='file'
                      accept='image/*'
                      multiple
                      className='hidden'
                      capture={isMobile ? 'environment' : undefined}
                      onChange={(e) => void addFiles(e.target.files)}
                      disabled={uploading}
                    />
                  </Label>
                ) : null}
              </div>
            </section>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className='shrink-0 border-t border-gray-100 px-5 py-4 bg-gray-50/80 rounded-b-2xl sm:rounded-b-2xl'>
          <div className='flex gap-3'>
             
            <Button
              variant='unstyled'
              type='button'
              disabled={busy || urls.length < minPhotos}
              onClick={() => void confirmDone()}
              className='flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-opacity shadow-sm'
              style={{ background: 'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-violet) 100%)' }}
            >
              {guide?.confirmLabel ?? 'ยืนยันว่าเสร็จสิ้น'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
