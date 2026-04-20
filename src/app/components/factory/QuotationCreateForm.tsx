import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Send, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { rfqsApi, quotationsApi } from '../../services/api';
import { useShippingMethods } from '../../hooks/master/useShippingMethods';
import { ShippingMethodLockedField } from './ShippingMethodLockedField';
import { hoursUntilDeadline } from '../../utils/rfqDeadline';

export interface QuotationCreateFormValues {
  price_per_piece: string;
  mold_cost: string;
  lead_time_days: string;
}

const DEFAULTS: QuotationCreateFormValues = {
  price_per_piece: '',
  mold_cost: '',
  lead_time_days: '',
};

export type QuotationCreateFormHandle = {
  getValues: () => QuotationCreateFormValues;
};

interface Props {
  rfqId: string;
  factoryId: number;
  lockedShippingMethodId: number;
  initial?: Partial<QuotationCreateFormValues>;
  /** When set, PATCH this quotation instead of POST create. */
  patchQuotationId?: string | null;
  submitLabel?: string;
  onSubmitted?: () => void | Promise<void>;
  /** View-only: disabled fields, no submit. */
  readOnly?: boolean;
  showHeading?: boolean;
  budgetPerPiece?: number | null;
  targetDaysCustomer?: number | null;
  deadlineIso?: string | null;
}

export const QuotationCreateForm = forwardRef<QuotationCreateFormHandle, Props>(
  function QuotationCreateForm(
    {
      rfqId,
      factoryId,
      lockedShippingMethodId,
      initial,
      patchQuotationId,
      submitLabel = 'ส่งใบเสนอราคา',
      onSubmitted,
      readOnly = false,
      showHeading = true,
      budgetPerPiece = null,
      targetDaysCustomer = null,
      deadlineIso = null,
    },
    ref,
  ) {
    const qc = useQueryClient();
    const shippingMethodsQ = useShippingMethods();
    const shipLabel =
      shippingMethodsQ.data?.find((m) => m.id === lockedShippingMethodId)?.label ??
      (lockedShippingMethodId > 0 ? `#${lockedShippingMethodId}` : '—');

    const form = useForm<QuotationCreateFormValues>({
      defaultValues: DEFAULTS,
      values: {
        price_per_piece: String(initial?.price_per_piece ?? ''),
        mold_cost: String(initial?.mold_cost ?? ''),
        lead_time_days: String(initial?.lead_time_days ?? ''),
      },
      mode: 'onBlur',
    });

    useImperativeHandle(ref, () => ({ getValues: () => form.getValues() }), [form]);

    const priceWatch = form.watch('price_per_piece');
    const leadWatch = form.watch('lead_time_days');

    const formWarnings = useMemo(() => {
      const w: string[] = [];
      const p = Number(priceWatch);
      const ld = Number(leadWatch);
      if (budgetPerPiece != null && Number.isFinite(p) && p > budgetPerPiece) {
        w.push('ราคาสูงกว่างบลูกค้า อาจถูกปฏิเสธ');
      }
      if (targetDaysCustomer != null && Number.isFinite(ld) && ld > targetDaysCustomer) {
        w.push(`ช้ากว่าที่ลูกค้าต้องการ ${targetDaysCustomer} วัน`);
      }
      const h = hoursUntilDeadline(deadlineIso);
      if (h != null && h > 0 && h < 24) {
        w.push('RFQ ใกล้ปิดรับ รีบยืนยัน');
      }
      return w;
    }, [priceWatch, leadWatch, budgetPerPiece, targetDaysCustomer, deadlineIso]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = useCallback(async () => {
      if (readOnly) return;
      const v = form.getValues();
      const priceN = Number(v.price_per_piece);
      const leadN = Number(v.lead_time_days);

      if (!Number.isFinite(priceN) || priceN <= 0) {
        setError('ราคาต่อชิ้นต้องมากกว่า 0');
        return;
      }
      if (!Number.isFinite(leadN) || leadN <= 0) {
        setError('Lead time ต้องมากกว่า 0');
        return;
      }
      if (lockedShippingMethodId <= 0) {
        setError('RFQ นี้ไม่มี shipping_method_id — ไม่สามารถออกใบเสนอราคาได้');
        return;
      }

      setSaving(true);
      setError('');
      try {
        const body = {
          factory_id: factoryId,
          price_per_piece: priceN,
          mold_cost: Number(v.mold_cost) || 0,
          lead_time_days: leadN,
          shipping_method_id: lockedShippingMethodId,
        };
        if (patchQuotationId) {
          await quotationsApi.patch(patchQuotationId, body);
        } else {
          await rfqsApi.createQuotation(rfqId, body);
        }
        form.reset(v);
        await qc.invalidateQueries({ queryKey: ['rfq', rfqId] });
        await qc.invalidateQueries({ queryKey: ['rfq', rfqId, 'quotations'] });
        await onSubmitted?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'ส่งไม่สำเร็จ');
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
    ]);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3"
      >
        {showHeading ? <h3 className="text-sm font-bold text-gray-900">ยื่นใบเสนอราคา</h3> : null}

        {error ? (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        ) : null}

        <label className="block">
          <span className="text-xs text-gray-500">ราคาต่อชิ้น *</span>
          <input
            type="number"
            step="0.01"
            disabled={readOnly}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('price_per_piece')}
          />
          {budgetPerPiece != null ? (
            <span className="text-[11px] text-gray-500">
              งบลูกค้า {budgetPerPiece.toLocaleString('th-TH')} บ./ชิ้น
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">ค่าแม่พิมพ์</span>
          <input
            type="number"
            disabled={readOnly}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('mold_cost')}
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Lead time (วัน) *</span>
          <input
            type="number"
            disabled={readOnly}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('lead_time_days')}
          />
          {targetDaysCustomer != null ? (
            <span className="text-[11px] text-gray-500">ลูกค้าต้องการ {targetDaysCustomer} วัน</span>
          ) : null}
        </label>

        <ShippingMethodLockedField methodName={shipLabel} hint="วิธีส่งถูกล็อกตาม RFQ ของลูกค้า" />

        {formWarnings.length > 0 ? (
          <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 space-y-1">
            {formWarnings.map((w) => (
              <li key={w}>
                ⚠ {w}
              </li>
            ))}
          </ul>
        ) : null}

        {!readOnly ? (
          <button
            type="submit"
            disabled={saving || !form.formState.isDirty}
            className="w-full rounded-xl text-white py-2.5 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            {patchQuotationId ? <Save size={14} /> : <Send size={14} />}
            {saving ? 'กำลังส่ง…' : submitLabel}
          </button>
        ) : null}
      </form>
    );
  },
);
