import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, ChevronRight } from 'lucide-react';
import { mediaApi } from '@/services/api/factoryApi';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { MergedProductionStep } from '@/components/features/production/types';
import { productionErrorMessage } from '@/components/features/production/productionErrors';
import { getStepGuide } from '@/components/features/production/stepGuideConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { useAppMutation } from '@/hooks/useAppMutation';
import { useImageUpload } from '@/hooks/useImageUpload';
import type { CustomerShippingInfo } from '@/domain/order/types';

export type { CustomerShippingInfo };

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

export function UpdateStepDrawer({
  open,
  placement,
  step,
  onClose,
  onSubmit,
}: Props) {
  const [notes, setNotes] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [courier, setCourier] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const { upload, isUploading } = useImageUpload({
    maxFiles: 5,
    multiple: true,
    onSuccess: (newUrls) => setUrls((prev) => [...prev, ...newUrls].slice(0, 5)),
    onError: (error) => setErr(productionErrorMessage(error)),
    fallbackMessage: 'อัปโหลดไม่สำเร็จ',
  });

  const submitMutation = useAppMutation({
    mutationFn: async ({
      body,
      opts,
    }: {
      body: Parameters<Props['onSubmit']>[0];
      opts?: Parameters<Props['onSubmit']>[1];
    }) => {
      await onSubmit(body, opts);
    },
    onMutate: () => setErr(''),
    onError: (error) => setErr(productionErrorMessage(error)),
  });

  const busy = submitMutation.isPending;
  const guide = step ? getStepGuide(Number(step.template.step_id ?? 0)) : null;
  const stepId = step ? Number(step.template.step_id ?? -1) : -1;
  const isShippingStep = stepId === 4;

  useEffect(() => {
    if (!open || !step) return;
    setNotes(String(step.update.description ?? '').slice(0, 500));
    setUrls([...(step.update.image_urls ?? [])].slice(0, 5));
    setErr('');
    // pre-fill tracking fields if already saved
    const desc = String(step.update.description ?? '');
    const match = desc.match(/(?:tracking|เลขพัสดุ|เลขติดตาม)[:\s#]*([A-Z0-9-]{6,})/i);
    setTrackingNo(match?.[1] ?? '');
    setCourier('');
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

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      await upload(files);
    },
    [upload],
  );

  const removeAt = (idx: number) => setUrls((u) => u.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    setUrls((u) => {
      const j = idx + dir;
      if (j < 0 || j >= u.length) return u;
      const c = [...u];
      [c[idx], c[j]] = [c[j], c[idx]];
      return c;
    });
  };

  const saveDraft = async () => {
    if (!step) return;
    try {
      await submitMutation.mutateAsync({
        body: {
          step_id: step.template.step_id,
          status: 'IP',
          description: notes.trim() || undefined,
          image_urls: urls,
          ...(isShippingStep && trackingNo.trim() ? { tracking_no: trackingNo.trim() } : {}),
          ...(isShippingStep && courier.trim() ? { courier: courier.trim() } : {}),
        },
      });
      onClose();
    } catch {
      // error surfaced via submitMutation
    }
  };

  const confirmDone = async () => {
    if (!step) return;
    if (urls.length < minPhotos) {
      setErr(`ต้องแนบภาพอย่างน้อย ${minPhotos} ภาพ`);
      return;
    }
    try {
      await submitMutation.mutateAsync({
        body: {
          step_id: step.template.step_id,
          status: 'CD',
          description: notes.trim() || undefined,
          image_urls: urls,
          confirm_payment_trigger: isPayment ? true : undefined,
          ...(isShippingStep && trackingNo.trim() ? { tracking_no: trackingNo.trim() } : {}),
          ...(isShippingStep && courier.trim() ? { courier: courier.trim() } : {}),
        },
        opts: { confirmPaymentTriggerHeader: isPayment },
      });
      onClose();
    } catch {
      // error surfaced via submitMutation
    }
  };

  if (!open || !step) return null;

  const sheet =
    placement === 'bottom'
      ? 'fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl'
      : 'fixed right-0 top-0 h-full w-full max-w-[520px] rounded-none sm:rounded-l-2xl';

  return (
    <div className='fixed inset-0 z-[70]'>
      <Button
        variant='unstyled'
        type='button'
        className='absolute inset-0 bg-black/40'
        aria-label='ปิดแผง'
        onClick={onClose}
      />
      <div
        className={`absolute bg-white shadow-2xl flex flex-col ${sheet}`}
        role='dialog'
        aria-modal
        aria-labelledby='drawer-title'
      >
        {placement === 'bottom' ? (
          <div className='flex justify-center pt-2 pb-1'>
            <div className='w-10 h-1 rounded-full bg-gray-300' />
          </div>
        ) : null}

        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            {guide ? <span className='text-lg leading-none'>{guide.emoji}</span> : null}
            <div className='min-w-0'>
              <h2 id='drawer-title' className='text-sm font-bold text-gray-900 truncate'>
                {step.template.step_name_th}
              </h2>
              {guide ? (
                <p className='text-[11px] text-indigo-600 font-medium mt-0.5'>{guide.whatToDo}</p>
              ) : null}
            </div>
          </div>
          <Button
            variant='unstyled'
            type='button'
            onClick={onClose}
            className='p-2 rounded-xl hover:bg-gray-100 shrink-0 ml-2'
            aria-label='ปิด'
          >
            <X size={20} />
          </Button>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
          {err ? <ErrorAlert size='sm'>{err}</ErrorAlert> : null}

          {guide ? (
            <div className='rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-3'>
              <p className='text-xs text-indigo-800 leading-relaxed'>{guide.guidance}</p>
            </div>
          ) : null}

          {guide && guide.bulletPoints.length > 0 ? (
            <div className='rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3'>
              <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2'>
                ประเด็นสำคัญ
              </p>
              <ul className='space-y-1.5'>
                {guide.bulletPoints.map((item, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2 text-xs text-gray-700 leading-relaxed'
                  >
                    <span className='mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5' />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* ── Step 4: Tracking No + Courier ── */}
          {isShippingStep ? (
            <div className='rounded-xl border border-orange-100 bg-orange-50 p-3.5 space-y-3'>
              <p className='text-xs font-bold text-orange-700 uppercase tracking-wide'>
                📦 ข้อมูลการจัดส่ง
              </p>
              <Label className='block'>
                <span className='text-xs font-medium text-gray-700'>Tracking Number</span>
                <Input
                  className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100'
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder='เช่น TH123456789'
                  maxLength={100}
                />
              </Label>
              <Label className='block'>
                <span className='text-xs font-medium text-gray-700'>บริษัทขนส่ง</span>
                <Input
                  className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100'
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder='เช่น Kerry, J&T, Flash Express, ไปรษณีย์ไทย'
                  maxLength={100}
                />
              </Label>
            </div>
          ) : null}

          <Label className='block'>
            <span className='text-xs font-medium text-gray-600'>
              หมายเหตุ / รายละเอียดเพิ่มเติม
            </span>
            <Textarea
              className='mt-1.5 w-full min-h-[88px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={guide?.notesPlaceholder ?? 'ระบุรายละเอียดความคืบหน้า...'}
            />
            <div className='text-xs text-gray-400 mt-0.5 text-right'>{notes.length}/500</div>
          </Label>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs font-medium text-gray-600'>ภาพหลักฐาน</span>
              <span
                className={`text-xs font-semibold ${urls.length >= minPhotos ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {urls.length}/{minPhotos} ขั้นต่ำ {urls.length >= minPhotos ? '✓' : ''}
              </span>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {urls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className='relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50'
                >
                  <Image src={url} alt='' className='w-full h-full object-cover' />
                  <Button
                    variant='unstyled'
                    type='button'
                    className='absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center'
                    aria-label='ลบภาพ'
                    onClick={() => removeAt(idx)}
                  >
                    ×
                  </Button>
                  <div className='absolute bottom-1 left-1 flex gap-0.5'>
                    <Button
                      variant='unstyled'
                      type='button'
                      aria-label='ขยับขึ้น'
                      className='px-1 text-[10px] bg-white/90 rounded'
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant='unstyled'
                      type='button'
                      aria-label='ขยับลง'
                      className='px-1 text-[10px] bg-white/90 rounded'
                      onClick={() => move(idx, 1)}
                      disabled={idx === urls.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
              {urls.length < 5 ? (
                <Label className='aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-colors'>
                  <Plus size={22} className='text-gray-400' />
                  <span className='text-[10px] text-gray-500 mt-1'>เพิ่มภาพ</span>
                  <Input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    capture={placement === 'bottom' ? 'environment' : undefined}
                    onChange={(e) => void addFiles(e.target.files)}
                    disabled={isUploading}
                  />
                </Label>
              ) : null}
            </div>
            {isUploading ? <p className='text-xs text-indigo-500 mt-1.5'>กำลังอัปโหลด…</p> : null}
          </div>

          {/* What happens next hint */}
          {guide ? (
            <div className='rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 flex items-start gap-2.5'>
              <ChevronRight size={14} className='text-slate-400 shrink-0 mt-0.5' />
              <p className='text-xs text-slate-500 leading-relaxed'>
                <span className='font-semibold text-slate-700'>เมื่อยืนยันเสร็จ: </span>
                {guide.nextStepHint}
              </p>
            </div>
          ) : null}
        </div>

        <div className='shrink-0 border-t border-gray-100 p-4 space-y-2 bg-white'>
          {isPayment ? (
            <div className='rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 text-center mb-1'>
              ⚠️ การยืนยันขั้นนี้จะ<strong>ส่งคำขอชำระเงิน</strong>
              ให้ลูกค้าทันที
            </div>
          ) : null}

          <Button
            variant='unstyled'
            type='button'
            disabled={busy}
            onClick={() => void saveDraft()}
            className='w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors'
          >
            {guide?.draftLabel ?? 'บันทึกร่าง'}
          </Button>

          <Button
            variant='unstyled'
            type='button'
            disabled={busy || urls.length < minPhotos}
            onClick={() => void confirmDone()}
            className='w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-opacity'
            style={{
              background:
                'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-violet) 100%)',
            }}
          >
            {guide?.confirmLabel ?? 'ยืนยันว่าเสร็จสิ้น'}
          </Button>
        </div>
      </div>
    </div>
  );
}
