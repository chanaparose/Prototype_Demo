import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '@/services/api/rfqApi';
import {
  mapQuotationToEditForm,
  quotationEditFormDefaults,
  quotationEditFormSchema,
  type QuotationEditFormInput,
  type QuotationEditFormValues,
} from '@/domain/factory/schemas/quotationEditForm.schema';
import { quotationKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { ShippingMethodLockedField } from '@/components/factory/ShippingMethodLockedField';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

export type QuotationAuditEditFormHandle = {
  submit: () => Promise<boolean>;
  isDirty: boolean;
};

type Props = {
  quotationId: string;
  factoryEntityId: number;
  rawQuotation: Record<string, unknown>;
  shippingMethodNameHint?: string;
  shippingMethodLabel?: string;
  isLocked?: boolean;
  onSaved?: (info: string) => void;
  onError?: (message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  showFooterActions?: boolean;
  saving?: boolean;
  onSavingChange?: (saving: boolean) => void;
  initialFactoryNote?: string;
};

export const QuotationAuditEditForm = forwardRef<QuotationAuditEditFormHandle, Props>(
  function QuotationAuditEditForm(
    {
      quotationId,
      factoryEntityId,
      rawQuotation,
      shippingMethodNameHint = '',
      shippingMethodLabel,
      isLocked = false,
      onSaved,
      onError,
      onDirtyChange,
      showFooterActions = false,
      saving: savingProp,
      onSavingChange,
      initialFactoryNote,
    },
    ref,
  ) {
    const qc = useQueryClient();
    const form = useForm<QuotationEditFormInput, unknown, QuotationEditFormValues>({
      resolver: zodResolver(quotationEditFormSchema),
      defaultValues: quotationEditFormDefaults,
      mode: 'onSubmit',
    });

    const lastPrefillKeyRef = useRef('');
    useEffect(() => {
      const next = mapQuotationToEditForm(rawQuotation);
      const key = JSON.stringify(next);
      if (lastPrefillKeyRef.current === key) return;
      if (form.formState.isDirty) return;
      form.reset(next);
      lastPrefillKeyRef.current = key;
    }, [rawQuotation, form]);

    const [factoryNote, setFactoryNote] = useState<string>(initialFactoryNote ?? '');
    useEffect(() => {
      setFactoryNote(initialFactoryNote ?? '');
    }, [initialFactoryNote]);

    const [internalSaving, setInternalSaving] = useState(false);
    const saving = savingProp ?? internalSaving;
    const setSaving = onSavingChange ?? setInternalSaving;
    const [error, setError] = useState('');

    const shipLabel =
      shippingMethodLabel ??
      shippingMethodNameHint ??
      (form.watch('shipping_method_id') != null ? `#${form.watch('shipping_method_id')}` : '—');

    const save = useCallback(
      async (values: QuotationEditFormValues): Promise<boolean> => {
        if (isLocked) {
          const msg = 'ใบเสนอราคานี้ถูกล็อกแล้ว ไม่สามารถแก้ไขได้';
          setError(msg);
          onError?.(msg);
          return false;
        }

        setSaving(true);
        setError('');
        try {
          await quotationsApi.update(quotationId, {
            factory_id: factoryEntityId,
            price_per_piece: Number(values.price_per_piece),
            mold_cost: Number(values.mold_cost) || 0,
            lead_time_days: Number(values.lead_time_days),
            shipping_method_id: values.shipping_method_id!,
            reason: values.reason.trim(),
            factory_note: factoryNote.trim() || undefined,
          });
          form.reset({ ...values, reason: '' });
          lastPrefillKeyRef.current = JSON.stringify(mapQuotationToEditForm(rawQuotation));
          await Promise.all([
            qc.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) }),
            qc.invalidateQueries({ queryKey: quotationKeys.history(quotationId) }),
          ]);
          onSaved?.('บันทึกการแก้ไขเรียบร้อย');
          return true;
        } catch (e) {
          const msg = getErrorMessage(e, 'บันทึกไม่สำเร็จ');
          setError(msg);
          onError?.(msg);
          return false;
        } finally {
          setSaving(false);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isLocked, quotationId, factoryEntityId, form, qc, rawQuotation, onSaved, onError, setSaving, factoryNote],
    );

    const submit = useCallback(async () => {
      let ok = false;
      await form.handleSubmit(async (values) => {
        ok = await save(values);
      })();
      return ok;
    }, [form, save]);

    useImperativeHandle(
      ref,
      () => ({
        submit,
        isDirty: form.formState.isDirty,
      }),
      [submit, form.formState.isDirty],
    );

    const formErrors = form.formState.errors;

    useEffect(() => {
      onDirtyChange?.(form.formState.isDirty);
    }, [form.formState.isDirty, onDirtyChange]);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className='space-y-4'
      >
        {error ? <ErrorAlert>{error}</ErrorAlert> : null}

        <div className='rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden'>
          <div className='bg-brand-page px-4 py-2.5 flex gap-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>
            <span className='flex-1'>รายการ</span>
            <span className='w-28 text-right'>ค่า</span>
          </div>

          <div className='px-4 py-3 border-t border-gray-50 hover:bg-brand-page flex items-center gap-4'>
            <Label className='flex-1 min-w-0'>
              <span className='text-xs text-gray-500 block mb-1'>ราคาต่อชิ้น *</span>
              <Input
                type='number'
                step='0.01'
                disabled={isLocked}
                className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none transition-colors disabled:bg-gray-50'
                {...form.register('price_per_piece')}
              />
              {formErrors.price_per_piece?.message ? (
                <p className='text-xs text-red-600 mt-1'>{formErrors.price_per_piece.message}</p>
              ) : null}
            </Label>
          </div>

          <div className='px-4 py-3 border-t border-gray-50 hover:bg-brand-page flex items-center gap-4'>
            <Label className='flex-1 min-w-0'>
              <span className='text-xs text-gray-500 block mb-1'>ค่าแม่พิมพ์</span>
              <Input
                type='number'
                disabled={isLocked}
                className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none transition-colors disabled:bg-gray-50'
                {...form.register('mold_cost')}
              />
            </Label>
          </div>

          <div className='px-4 py-3 border-t border-gray-50 hover:bg-brand-page flex items-center gap-4'>
            <Label className='flex-1 min-w-0'>
              <span className='text-xs text-gray-500 block mb-1'>Lead time (วัน) *</span>
              <Input
                type='number'
                disabled={isLocked}
                className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none transition-colors disabled:bg-gray-50'
                {...form.register('lead_time_days')}
              />
              {formErrors.lead_time_days?.message ? (
                <p className='text-xs text-red-600 mt-1'>{formErrors.lead_time_days.message}</p>
              ) : null}
            </Label>
          </div>

          <div
            className={`px-4 py-3 border-t border-gray-50 hover:bg-brand-page ${isLocked ? 'opacity-70' : ''}`}
          >
            <span className='text-xs text-gray-500 block mb-1'>วิธีจัดส่ง</span>
            <ShippingMethodLockedField
              methodName={shipLabel}
              hint='ใช้ค่าเดิมจากใบเสนอราคา (ตรงกับ RFQ ของลูกค้า) — แก้ไขวิธีส่งไม่ได้'
            />
            {formErrors.shipping_method_id?.message ? (
              <p className='text-xs text-red-600 mt-1'>{formErrors.shipping_method_id.message}</p>
            ) : null}
          </div>
        </div>

        <div
          className='rounded-2xl p-4 space-y-2 text-white shadow-md'
          style={{ background: 'linear-gradient(135deg, var(--brand-navy) 0%, #4A267D 100%)' }}
        >
          <p className='text-[10px] font-semibold uppercase tracking-wide opacity-60'>
            สรุปใบเสนอราคา
          </p>
          <div className='flex justify-between text-sm'>
            <span className='opacity-80'>ราคาต่อชิ้น</span>
            <span className='font-semibold'>
              {formatCurrency(Number(form.watch('price_per_piece') || 0))}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='opacity-80'>ค่าแม่พิมพ์</span>
            <span className='font-semibold'>
              {formatCurrency(Number(form.watch('mold_cost') || 0))}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='opacity-80'>Lead time</span>
            <span className='font-semibold'>{form.watch('lead_time_days') || '—'} วัน</span>
          </div>
        </div>

        <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
            Note (สำหรับโรงงานเท่านั้น)
          </p>
          <p className='text-[11px] text-slate-400 -mt-1'>บันทึกภายใน ลูกค้าจะไม่เห็นข้อความนี้</p>
          <textarea
            value={factoryNote}
            onChange={(e) => setFactoryNote(e.target.value)}
            disabled={isLocked}
            rows={3}
            placeholder='เช่น ต้องสั่งวัตถุดิบพิเศษ, ต้องประสานงานแผนก…'
            className='w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60 resize-none'
          />
        </section>

        <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
            เหตุผลการแก้ไข
          </p>
          <Label className='block'>
            <span className='text-xs text-gray-500 mb-1.5 block'>
              เหตุผล * (บันทึกลง audit log)
            </span>
            <Textarea
              disabled={isLocked}
              rows={3}
              className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none transition-colors disabled:bg-gray-50 resize-none'
              placeholder='เช่น ปรับลดราคาตามเจรจาลูกค้า'
              {...form.register('reason')}
            />
            {formErrors.reason?.message ? (
              <p className='text-xs text-red-600 mt-1'>{formErrors.reason.message}</p>
            ) : null}
          </Label>
        </section>

        {showFooterActions ? (
          <div className='flex gap-3'>
            <Button
              variant='unstyled'
              type='button'
              disabled={isLocked || saving}
              onClick={() => void submit()}
              className='flex-1 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-50 inline-flex items-center justify-center gap-2'
              style={{ borderColor: 'var(--brand-indigo)', color: 'var(--brand-indigo)' }}
            >
              <Save size={14} /> บันทึกร่าง
            </Button>
            <Button
              variant='unstyled'
              type='button'
              disabled={isLocked || saving || !form.formState.isDirty}
              onClick={() => void submit()}
              className='flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2'
              style={{
                background:
                  'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
              }}
            >
              {saving ? 'กำลังบันทึก…' : 'ส่ง'}
            </Button>
          </div>
        ) : null}
      </form>
    );
  },
);
