import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, History, Lock, Save } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { quotationsApi } from '../../services/api';

import { useEditForm } from '../../hooks/forms/useEditForm';
import { useBeforeUnload } from '../../hooks/forms/useBeforeUnload';
import { useShippingMethods } from '../../hooks/master/useShippingMethods';
import { FormSkeleton } from '../../components/common/FormSkeleton';
import { ShippingMethodLockedField } from '../../components/factory/ShippingMethodLockedField';

type Raw = Record<string, unknown>;

interface QuotationFormValues {
  price_per_piece: string;
  mold_cost: string;
  lead_time_days: string;
  shipping_method_id: number | null;
  reason: string;
}

const DEFAULTS: QuotationFormValues = {
  price_per_piece: '',
  mold_cost: '',
  lead_time_days: '',
  shipping_method_id: null,
  reason: '',
};

function mapQuotationToForm(raw: Raw): QuotationFormValues {
  const r = raw ?? {};
  const sid = Number(r.shipping_method_id ?? 0);
  return {
    price_per_piece: String(r.price_per_piece ?? ''),
    mold_cost: String(r.mold_cost ?? ''),
    lead_time_days: String(r.lead_time_days ?? ''),
    shipping_method_id: Number.isFinite(sid) && sid > 0 ? sid : null,
    reason: '',
  };
}

export function FactoryEditQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const factoryEntityId = getFactoryEntityId(user);

  const { form, isLoading, isError, refetch } = useEditForm<QuotationFormValues, Raw>({
    queryKey: ['quotation', id] as const,
    queryFn: () => quotationsApi.get(id!),
    mapper: mapQuotationToForm,
    defaults: DEFAULTS,
    enabled: Boolean(id),
  });

  const rawQ = useQuery({
    queryKey: ['quotation', id, 'raw'] as const,
    queryFn: () => quotationsApi.get(id!),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
  const raw = (rawQ.data ?? {}) as Raw;
  const status = String(raw.status ?? 'PD').toUpperCase();
  const isLocked = Boolean(raw.is_locked) || status === 'AC';
  const version = String(raw.version ?? 1);
  const shippingMethodNameHint = String(raw.shipping_method_name ?? '').trim();

  const historyQ = useQuery({
    queryKey: ['quotation', id, 'history'] as const,
    queryFn: () => quotationsApi.history(id!),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
  const history = Array.isArray(historyQ.data) ? (historyQ.data as Raw[]) : [];

  const shippingMethodsQ = useShippingMethods();
  const lockedShipId = form.watch('shipping_method_id');
  const shipLabel = (() => {
    if (shippingMethodNameHint) return shippingMethodNameHint;
    const row = shippingMethodsQ.data?.find((m) => m.id === lockedShipId);
    return row?.label ?? (lockedShipId != null ? `#${lockedShipId}` : '—');
  })();

  useBeforeUnload(form.formState.isDirty);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const save = useCallback(async () => {
    if (!id) return;
    if (isLocked) {
      setError('ใบเสนอราคานี้ถูกล็อกแล้ว ไม่สามารถแก้ไขได้');
      return;
    }
    if (factoryEntityId == null) {
      setError('ไม่พบข้อมูลโรงงาน กรุณา login ใหม่');
      return;
    }
    const v = form.getValues();

    const priceN = Number(v.price_per_piece);
    if (!v.price_per_piece || Number.isNaN(priceN) || priceN <= 0) {
      setError('กรุณากรอกราคาต่อชิ้นที่ถูกต้อง');
      return;
    }
    const leadN = Number(v.lead_time_days);
    if (!Number.isFinite(leadN) || leadN <= 0) {
      setError('กรอกระยะเวลาผลิต (วัน) ให้มากกว่า 0');
      return;
    }
    if (v.shipping_method_id == null) {
      setError('ไม่พบวิธีจัดส่งในใบเสนอราคา — ไม่สามารถบันทึกได้');
      return;
    }
    if (!v.reason.trim()) {
      setError('กรุณากรอกเหตุผลการแก้ไข');
      return;
    }

    setSaving(true);
    setError('');
    setInfo('');
    try {
      await quotationsApi.patch(id, {
        factory_id: factoryEntityId,
        price_per_piece: priceN,
        mold_cost: Number(v.mold_cost) || 0,
        lead_time_days: leadN,
        shipping_method_id: v.shipping_method_id,
        reason: v.reason.trim(),
      });
      setInfo('บันทึกการแก้ไขเรียบร้อย');
      form.reset({ ...v, reason: '' });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['quotation', id] }),
        qc.invalidateQueries({ queryKey: ['quotation', id, 'raw'] }),
        qc.invalidateQueries({ queryKey: ['quotation', id, 'history'] }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [id, isLocked, factoryEntityId, form, qc]);

  if (!id) return null;
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600 mb-3">โหลดใบเสนอราคาไม่สำเร็จ</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 rounded-xl border text-sm"
        >
          ลองใหม่
        </button>
      </div>
    );
  }
  if (isLoading) return <FormSkeleton sections={2} />;

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400">QUOTATION</p>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
            แก้ไขใบเสนอราคา #{id}
          </h1>
        </div>
        {isLocked && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
            <Lock size={12} /> ถูกล็อก
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>}
      {info && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 mb-4">{info}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-4"
      >
        <div className="text-xs text-gray-500">
          สถานะ: <strong className="text-gray-900">{status}</strong>
          {' · '}เวอร์ชัน: <strong>{version}</strong>
        </div>

        <label className="block">
          <span className="text-xs text-gray-500">ราคาต่อชิ้น *</span>
          <input
            type="number"
            step="0.01"
            disabled={isLocked}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('price_per_piece')}
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">ค่าแม่พิมพ์</span>
          <input
            type="number"
            disabled={isLocked}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('mold_cost')}
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Lead time (วัน) *</span>
          <input
            type="number"
            disabled={isLocked}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            {...form.register('lead_time_days')}
          />
        </label>

        <div className={isLocked ? 'opacity-70' : ''}>
          <ShippingMethodLockedField
            methodName={shipLabel}
            hint="ใช้ค่าเดิมจากใบเสนอราคา (ตรงกับ RFQ ของลูกค้า) — แก้ไขวิธีส่งไม่ได้"
          />
        </div>

        <label className="block">
          <span className="text-xs text-gray-500">เหตุผลที่แก้ไข * (บันทึกลง audit log)</span>
          <textarea
            disabled={isLocked}
            rows={2}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            placeholder="เช่น ปรับลดราคาตามเจรจาลูกค้า"
            {...form.register('reason')}
          />
        </label>

        <button
          type="submit"
          disabled={isLocked || saving || !form.formState.isDirty}
          className="w-full rounded-xl text-white py-2.5 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          <Save size={14} /> {saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
        </button>
      </form>

      <section className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <History size={16} /> ประวัติการแก้ไข
        </h2>
        {historyQ.isLoading ? (
          <p className="text-sm text-gray-400">กำลังโหลดประวัติ…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มีประวัติการแก้ไข</p>
        ) : (
          <ol className="space-y-2 text-xs">
            {history.map((h, i) => (
              <li
                key={String(h.history_id ?? i)}
                className="border-l-2 border-purple-200 pl-3 py-1"
              >
                <div className="text-gray-900 font-medium">
                  v{String(h.version ?? '?')} · {String(h.change_type ?? '')}
                </div>
                <div className="text-gray-500">
                  {String(h.created_at ?? '')} โดย user #{String(h.changed_by ?? '')}
                </div>
                {h.reason ? (
                  <div className="text-gray-600 mt-0.5">เหตุผล: {String(h.reason)}</div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
