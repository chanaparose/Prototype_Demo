import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Send, Save, Loader2, ImagePlus, Lock, X as XIcon } from 'lucide-react';
import { FactoryNoteField } from '@/components/factory/FactoryNoteField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getErrorMessage } from '@/lib/apiError';
import {
  quotationFormSchema,
  type QuotationFormSchemaValues,
} from '@/domain/factory/schemas/quotationForm.schema';
import { useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '@/services/api/rfqApi';
import { mediaApi } from '@/services/api/factoryApi';
import type { IQuotationBreakdown } from '@/services/api/types/rfq.types';
import { calculateQuotationBreakdown, type CommissionConfig } from '@/utils/quotationCalculator';
import { useShippingMethods } from '@/hooks/master/useShippingMethods';
import { ShippingMethodLockedField } from '@/components/factory/ShippingMethodLockedField';
import { hoursUntilDeadline } from '@/utils/rfqDeadline';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryHighlightField } from '@/components/features/factory-rfq/FactoryHighlightField';
import { formatCurrency, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { FormField } from '@/shared/ui/forms/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';

const LOCKED_PAYMENT_TERMS = 'lc_at_sight';

export type QuotationCreateFormValues = QuotationFormSchemaValues;

const DEFAULTS: QuotationCreateFormValues = {
  price_per_piece: '',
  tooling_mold_cost: '',
  shipping_cost: '',
  packaging_cost: '',
  lead_time_days: '',
  validity_days: '14',
};

export type QuotationCreateFormHandle = {
  getValues: () => QuotationCreateFormValues;
};

interface Props {
  rfqId: string;
  factoryId: number;
  lockedShippingMethodId?: number; // optional — 0 or undefined = ไม่มีวิธีจัดส่งจาก RFQ
  lockedShippingMethodName?: string;
  rfqQuantity?: number | null; // จำนวนที่ลูกค้าขอ — ใช้คำนวณ preview
  initial?: Partial<QuotationCreateFormValues>;
  initialImageUrls?: string[]; // รูปภาพที่บันทึกไว้แล้ว (pre-fill)
  initialFactoryHighlight?: string;
  initialFactoryNote?: string;
  patchQuotationId?: string | null; // PATCH mode
  submitLabel?: string;
  pageError?: string;
  onSubmitted?: () => void | Promise<void>;
  readOnly?: boolean;
  showHeading?: boolean;
  budgetPerPiece?: number | null;
  targetDaysCustomer?: number | null;
  deadlineIso?: string | null;
  commissionConfig?: CommissionConfig | null;
}

function fmt(n: number): string {
  return formatCurrencyNoDecimals(n);
}

export const QuotationCreateForm = forwardRef<QuotationCreateFormHandle, Props>(
  function QuotationCreateForm(
    {
      rfqId,
      factoryId,
      lockedShippingMethodId,
      lockedShippingMethodName,
      rfqQuantity = null,
      initial,
      initialImageUrls,
      initialFactoryHighlight,
      initialFactoryNote,
      patchQuotationId,
      submitLabel = 'ส่งใบเสนอราคา',
      pageError,
      onSubmitted,
      readOnly = false,
      showHeading = true,
      budgetPerPiece = null,
      targetDaysCustomer = null,
      deadlineIso = null,
      commissionConfig = null,
    },
    ref,
  ) {
    const qc = useQueryClient();
    const shippingMethodsQ = useShippingMethods(!lockedShippingMethodName);
    const shipId = lockedShippingMethodId ?? 0;
    const shipLabel =
      String(lockedShippingMethodName ?? '').trim() ||
      shippingMethodsQ.data?.find((m) => m.id === shipId)?.label ||
      (shipId > 0 ? `#${shipId}` : '—');

    const form = useForm<QuotationCreateFormValues>({
      resolver: zodResolver(quotationFormSchema),
      defaultValues: DEFAULTS,
      values: {
        price_per_piece: String(initial?.price_per_piece ?? ''),
        tooling_mold_cost: String(initial?.tooling_mold_cost ?? ''),
        shipping_cost: String(initial?.shipping_cost ?? ''),
        packaging_cost: String(initial?.packaging_cost ?? ''),
        lead_time_days: String(initial?.lead_time_days ?? ''),
        validity_days: String(initial?.validity_days ?? '14'),
      },
      mode: 'onBlur',
    });

    useImperativeHandle(ref, () => ({ getValues: () => form.getValues() }), [form]);

    const priceWatch = form.watch('price_per_piece');
    const leadWatch = form.watch('lead_time_days');
    const shippingWatch = form.watch('shipping_cost');
    const packagingWatch = form.watch('packaging_cost');
    const moldWatch = form.watch('tooling_mold_cost');

    const formWarnings = useMemo(() => {
      const w: string[] = [];
      const p = Number(priceWatch);
      const ld = Number(leadWatch);
      if (budgetPerPiece != null && Number.isFinite(p) && p > budgetPerPiece) {
        w.push('ราคาต่อชิ้นสูงกว่างบลูกค้า — อาจถูกปฏิเสธ');
      }
      if (targetDaysCustomer != null && Number.isFinite(ld) && ld > targetDaysCustomer) {
        w.push(`Lead time ช้ากว่าที่ลูกค้าต้องการ (${targetDaysCustomer} วัน)`);
      }
      const h = hoursUntilDeadline(deadlineIso);
      if (h != null && h > 0 && h < 24) {
        w.push('RFQ ใกล้ปิดรับ — รีบยืนยัน');
      }
      return w;
    }, [priceWatch, leadWatch, budgetPerPiece, targetDaysCustomer, deadlineIso]);

    const preview = useMemo<IQuotationBreakdown | null>(() => {
      if (!commissionConfig) return null;
      const priceN = Number(priceWatch);
      const qty = rfqQuantity ?? 0;
      return calculateQuotationBreakdown(commissionConfig, {
        pricePerPiece: priceN,
        quantity: qty,
        shippingCost: Number(shippingWatch) || 0,
        packagingCost: Number(packagingWatch) || 0,
        toolingMoldCost: Number(moldWatch) || 0,
      });
    }, [commissionConfig, priceWatch, shippingWatch, packagingWatch, moldWatch, rfqQuantity]);
    const previewLoading = false;

    const [imageUrls, setImageUrls] = useState<string[]>(() => initialImageUrls ?? []);
    const [factoryHighlight, setFactoryHighlight] = useState<string>(initialFactoryHighlight ?? '');
    const [factoryNote, setFactoryNote] = useState<string>(initialFactoryNote ?? '');
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setImageUrls(initialImageUrls ?? []);
    }, [initialImageUrls]);
    useEffect(() => {
      setFactoryHighlight(initialFactoryHighlight ?? '');
    }, [initialFactoryHighlight]);
    useEffect(() => {
      setFactoryNote(initialFactoryNote ?? '');
    }, [initialFactoryNote]);

    const highlightError = useMemo(() => {
      if ((factoryHighlight.trim().length ?? 0) > 200) return 'สูงสุด 200 ตัวอักษร';
      return null;
    }, [factoryHighlight]);

    const handleImageFiles = useCallback(
      async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingImage(true);
        try {
          const uploaded = await Promise.all(
            Array.from(files).map((f) => mediaApi.upload(f).then((r) => r.url as string)),
          );
          setImageUrls((prev) => [...prev, ...uploaded]);

          form.setValue('price_per_piece', form.getValues('price_per_piece'), {
            shouldDirty: true,
          });
        } catch {
        } finally {
          setUploadingImage(false);
          if (imageInputRef.current) imageInputRef.current.value = '';
        }
      },
      [form],
    );

    const removeImage = useCallback(
      (url: string) => {
        setImageUrls((prev) => prev.filter((u) => u !== url));
        form.setValue('price_per_piece', form.getValues('price_per_piece'), { shouldDirty: true });
      },
      [form],
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = useCallback(async () => {
      if (readOnly) return;
      if (highlightError) {
        setError(highlightError);
        return;
      }

      const valid = await form.trigger();
      if (!valid) {
        const first =
          form.formState.errors.price_per_piece?.message ??
          form.formState.errors.lead_time_days?.message ??
          form.formState.errors.validity_days?.message ??
          'กรุณาตรวจสอบข้อมูลในฟอร์ม';
        setError(first);
        return;
      }

      const v = form.getValues();
      const priceN = Number(v.price_per_piece);
      const leadN = Number(v.lead_time_days);

      setSaving(true);
      setError('');
      try {
        const shipId = lockedShippingMethodId ?? 0;
        const body: Record<string, unknown> = {
          factory_id: factoryId,
          price_per_piece: priceN,
          tooling_mold_cost: Number(v.tooling_mold_cost) || 0,
          shipping_cost: Number(v.shipping_cost) || 0,
          packaging_cost: Number(v.packaging_cost) || 0,
          lead_time_days: leadN,
          validity_days: Number(v.validity_days) || 14,
          image_urls: imageUrls,
          factory_highlight: factoryHighlight.trim() || undefined,
          factory_note: factoryNote.trim() || undefined,
          reason: 'อัปเดตใบเสนอราคา',
        };

        if (shipId > 0) body.shipping_method_id = shipId;

        body.payment_terms = LOCKED_PAYMENT_TERMS;
        if (patchQuotationId) {
          await quotationsApi.update(patchQuotationId, body);
        } else {
          await quotationsApi.create(rfqId, body);
        }
        form.reset(v);
        await qc.invalidateQueries({ queryKey: ['rfq', rfqId] });
        await qc.invalidateQueries({ queryKey: ['rfq', rfqId, 'quotations'] });
        await onSubmitted?.();
      } catch (e) {
        setError(getErrorMessage(e, 'ส่งไม่สำเร็จ'));
      } finally {
        setSaving(false);
      }
    }, [
      readOnly,
      form,
      rfqId,
      factoryId,
      lockedShippingMethodId,
      patchQuotationId,
      qc,
      onSubmitted,
      imageUrls,
      factoryHighlight,
      highlightError,
    ]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className='bg-white rounded-2xl border border-gray-100 p-4 space-y-4'
      >
        {showHeading ? <h3 className='text-sm font-bold text-gray-900'>ยื่นใบเสนอราคา</h3> : null}

        <FormField
          label='ราคาต่อชิ้น (บาท)'
          required
          error={form.formState.errors.price_per_piece?.message}
          helperText={
            budgetPerPiece != null
              ? `งบลูกค้า ${formatCurrency(budgetPerPiece)} ต่อชิ้น`
              : undefined
          }
        >
          <Input
            type='number'
            step='0.01'
            min={0}
            disabled={readOnly}
            placeholder='0.00'
            className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
            {...form.register('price_per_piece')}
          />
        </FormField>

        <div>
          <p className='text-xs font-semibold text-gray-600 mb-2'>ค่าใช้จ่ายเพิ่มเติม</p>
          <div className='grid grid-cols-3 gap-2'>
            <FormField label='ค่าขนส่ง' labelClassName='text-[11px]'>
              <Input
                type='number'
                step='0.01'
                min={0}
                disabled={readOnly}
                placeholder='0'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
                {...form.register('shipping_cost')}
              />
            </FormField>
            <FormField label='ค่าบรรจุภัณฑ์' labelClassName='text-[11px]'>
              <Input
                type='number'
                step='0.01'
                min={0}
                disabled={readOnly}
                placeholder='0'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
                {...form.register('packaging_cost')}
              />
            </FormField>
            <FormField label='ค่าแม่พิมพ์' labelClassName='text-[11px]'>
              <Input
                type='number'
                step='0.01'
                min={0}
                disabled={readOnly}
                placeholder='0'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
                {...form.register('tooling_mold_cost')}
              />
            </FormField>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <FormField
            label='Lead time (วัน)'
            required
            error={form.formState.errors.lead_time_days?.message}
            helperText={
              targetDaysCustomer != null ? `ลูกค้าต้องการ ${targetDaysCustomer} วัน` : undefined
            }
          >
            <Input
              type='number'
              min={1}
              disabled={readOnly}
              placeholder='30'
              className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
              {...form.register('lead_time_days')}
            />
          </FormField>
          <FormField
            label='ใบเสนอราคาหมดอายุ (วัน)'
            error={form.formState.errors.validity_days?.message}
          >
            <Input
              type='number'
              min={1}
              disabled={readOnly}
              placeholder='14'
              className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50'
              {...form.register('validity_days')}
            />
          </FormField>
        </div>

        <div className='rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5'>
          <div className='flex items-center justify-between gap-2 mb-1'>
            <span className='text-xs font-medium text-gray-500'>เงื่อนไขการชำระเงิน</span>
            <Lock size={14} className='text-gray-400 shrink-0' aria-hidden />
          </div>
          <p className='text-sm font-semibold text-gray-800'>ชำระเต็ม 100% ก่อนเริ่มผลิต</p>
          <p className='text-[11px] text-gray-500 mt-1'>
            นโยบายแพลตฟอร์ม — ลูกค้าชำระครบก่อนโรงงานรับงาน
          </p>
        </div>

        {shipId > 0 ? (
          <ShippingMethodLockedField
            methodName={shipLabel}
            hint='วิธีส่งถูกล็อกตาม RFQ ของลูกค้า'
          />
        ) : null}

        <FactoryHighlightField
          value={factoryHighlight}
          onChange={setFactoryHighlight}
          isLocked={readOnly}
          maxLength={200}
          error={highlightError}
        />

        {/* factory_note — shown only when creating (edit mode uses FactoryNoteInline) */}
        {!patchQuotationId ? (
          <FactoryNoteField
            value={factoryNote}
            onChange={setFactoryNote}
            disabled={readOnly}
          />
        ) : null}

        {!readOnly ? (
          <div>
            <p className='text-xs font-semibold text-gray-600 mb-2'>รูปภาพประกอบ (ถ้ามี)</p>

            {imageUrls.length > 0 ? (
              <div className='grid grid-cols-3 gap-2 mb-2'>
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className='relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200'
                  >
                    <Image src={url} alt='' className='w-full h-full object-cover' />
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => removeImage(url)}
                      className='absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center'
                      aria-label='ลบรูปภาพ'
                      title='ลบรูปภาพ'
                    >
                      <XIcon size={10} className='text-white' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <Input
              ref={imageInputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={(e) => void handleImageFiles(e.target.files)}
              aria-label='เลือกรูปภาพ'
            />
            <Button
              variant='unstyled'
              type='button'
              disabled={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
              className='inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-600 disabled:opacity-50'
            >
              {uploadingImage ? (
                <>
                  <Loader2 size={13} className='animate-spin' />
                  กำลังอัปโหลด…
                </>
              ) : (
                <>
                  <ImagePlus size={13} />
                  เพิ่มรูปภาพ
                </>
              )}
            </Button>
          </div>
        ) : imageUrls.length > 0 ? (
          <div>
            <p className='text-xs font-semibold text-gray-600 mb-2'>รูปภาพประกอบ</p>
            <div className='grid grid-cols-3 gap-2'>
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className='aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200'
                >
                  <Image src={url} alt='' className='w-full h-full object-cover' />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(preview || previewLoading) && rfqQuantity && rfqQuantity > 0 ? (
          <div className='rounded-xl border border-violet-100 bg-violet-50/60 p-3 space-y-1.5'>
            <div className='flex items-center justify-between mb-1'>
              <p className='text-[11px] font-bold text-violet-700 uppercase tracking-wide'>
                สรุปค่าใช้จ่าย (ประมาณ)
              </p>
              {previewLoading ? (
                <Loader2 size={13} className='animate-spin text-violet-400' />
              ) : null}
            </div>
            {preview ? (
              <>
                <Row label='ค่าสินค้ารวม' value={`${fmt(preview.subtotal)}`} />
                {preview.shipping_cost > 0 && (
                  <Row label='ค่าขนส่ง' value={`${fmt(preview.shipping_cost)}`} />
                )}
                {preview.packaging_cost > 0 && (
                  <Row label='ค่าบรรจุภัณฑ์' value={`${fmt(preview.packaging_cost)}`} />
                )}
                {preview.tooling_mold_cost > 0 && (
                  <Row label='ค่าแม่พิมพ์' value={`${fmt(preview.tooling_mold_cost)}`} />
                )}
                <Row
                  label={`VAT ${preview.vat_rate.toFixed(0)}%`}
                  value={`${fmt(preview.vat_amount)}`}
                />
                <div className='border-t border-violet-200 pt-1.5 mt-1.5 space-y-1'>
                  <Row label='รวมทั้งหมด' value={`${fmt(preview.grand_total)}`} bold />
                  <Row
                    label='โรงงานได้รับ (หลังหักค่าบริการ)'
                    value={`${fmt(preview.factory_net_receivable)}`}
                    highlight
                  />
                  <p className='text-[10px] text-violet-500 text-right'>
                    ค่าบริการแพลตฟอร์ม {preview.platform_commission_rate.toFixed(1)}%
                  </p>
                </div>
              </>
            ) : (
              <div className='h-16 flex items-center justify-center'>
                <Loader2 size={18} className='animate-spin text-violet-300' />
              </div>
            )}
          </div>
        ) : null}

        {formWarnings.length > 0 ? (
          <ul className='text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 space-y-1'>
            {formWarnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        ) : null}

        {!readOnly ? (
          <>
            {pageError ? <ErrorAlert size='sm'>{pageError}</ErrorAlert> : null}
            {error ? <ErrorAlert size='sm'>{error}</ErrorAlert> : null}
            <Button
              variant='unstyled'
              type='submit'
              disabled={
                saving ||
                (!form.formState.isDirty &&
                  (factoryHighlight ?? '') === (initialFactoryHighlight ?? '') &&
                  (factoryNote ?? '') === (initialFactoryNote ?? '')) ||
                Boolean(highlightError)
              }
              className='w-full rounded-xl text-white py-2.5 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-brand-purple to-brand-violet'
            >
              {saving ? (
                <>
                  <Loader2 size={14} className='animate-spin' />
                  กำลังส่ง…
                </>
              ) : (
                <>
                  {patchQuotationId ? <Save size={14} /> : <Send size={14} />}
                  {submitLabel}
                </>
              )}
            </Button>
          </>
        ) : pageError ? (
          <ErrorAlert size='sm'>{pageError}</ErrorAlert>
        ) : null}
      </form>
    );
  },
);

function Row({
  label,
  value,
  bold = false,
  highlight = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <span
        className={`text-[11px] ${highlight ? 'text-violet-800 font-bold' : bold ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}
      >
        {label}
      </span>
      <span
        className={`text-[12px] tabular-nums ${highlight ? 'text-violet-900 font-bold' : bold ? 'text-gray-800 font-semibold' : 'text-gray-700'}`}
      >
        {value}
      </span>
    </div>
  );
}
