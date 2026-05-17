import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, History, Lock, Save } from 'lucide-react';

import { useAuth } from '@/stores';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { quotationsApi } from '@/services/api';

import { useEditForm } from '@/hooks/forms/useEditForm';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';
import { useShippingMethods } from '@/hooks/master/useShippingMethods';
import { FormSkeleton } from '@/components/common/FormSkeleton';
import { ShippingMethodLockedField } from '@/components/factory/ShippingMethodLockedField';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600 mb-3'>โหลดใบเสนอราคาไม่สำเร็จ</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void refetch()}
          className='px-4 py-2 rounded-xl border text-sm'
        >
          ลองใหม่
        </Button>
      </div>
    );
  }
  if (isLoading) return <FormSkeleton sections={2} />;

  return (
    <div style={{ backgroundColor: 'var(--brand-page)' }} className='min-h-screen pb-28'>
      <div className='sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center gap-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
          style={{ color: 'var(--brand-indigo)' }}
        >
          <ChevronLeft size={22} />
        </Button>
        <div className='flex-1 min-w-0'>
          <h1 className='font-bold text-sm truncate' style={{ color: 'var(--brand-navy)' }}>
            แก้ไขใบเสนอราคา #{id}
          </h1>
        </div>
        {isLocked && (
          <span className='inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg shrink-0'>
            <Lock size={12} /> ถูกล็อก
          </span>
        )}
      </div>

      <div className='max-w-3xl mx-auto px-4 pt-4 space-y-4 w-full min-w-0'>
        {error && (
          <p className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3'>
            {error}
          </p>
        )}
        {info && (
          <p className='text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3'>
            {info}
          </p>
        )}

        <div className='flex items-center gap-2 text-xs text-gray-500'>
          <span className='bg-white border border-gray-100 rounded-lg px-2.5 py-1 font-medium'>
            สถานะ: <strong className='text-gray-900'>{status}</strong>
          </span>
          <span className='bg-white border border-gray-100 rounded-lg px-2.5 py-1 font-medium'>
            เวอร์ชัน: <strong className='text-gray-900'>{version}</strong>
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className='space-y-4'
        >
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
                ฿
                {Number(form.watch('price_per_piece') || 0).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='opacity-80'>ค่าแม่พิมพ์</span>
              <span className='font-semibold'>
                ฿
                {Number(form.watch('mold_cost') || 0).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='opacity-80'>Lead time</span>
              <span className='font-semibold'>{form.watch('lead_time_days') || '—'} วัน</span>
            </div>
          </div>

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
            </Label>
          </section>
        </form>

        <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4'>
          <h2
            className='font-bold flex items-center gap-2 mb-3 text-sm'
            style={{ color: 'var(--brand-navy)' }}
          >
            <History size={16} style={{ color: 'var(--brand-indigo)' }} /> ประวัติการแก้ไข
          </h2>
          {historyQ.isLoading ? (
            <p className='text-sm text-gray-400'>กำลังโหลดประวัติ…</p>
          ) : history.length === 0 ? (
            <p className='text-sm text-gray-500'>ยังไม่มีประวัติการแก้ไข</p>
          ) : (
            <ol className='space-y-2.5 text-xs'>
              {history.map((h, i) => (
                <li
                  key={String(h.history_id ?? i)}
                  className='border-l-2 pl-3 py-1'
                  style={{ borderColor: 'var(--brand-indigo)' }}
                >
                  <div className='font-medium' style={{ color: 'var(--brand-navy)' }}>
                    v{String(h.version ?? '?')} · {String(h.change_type ?? '')}
                  </div>
                  <div className='text-gray-500'>
                    {String(h.created_at ?? '')} โดย user #{String(h.changed_by ?? '')}
                  </div>
                  {h.reason ? (
                    <div className='text-gray-600 mt-0.5'>เหตุผล: {String(h.reason)}</div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className='fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 p-4'>
        <div className='max-w-3xl mx-auto flex gap-3'>
          <Button
            variant='unstyled'
            type='button'
            disabled={isLocked || saving}
            onClick={() => void save()}
            className='flex-1 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-50 inline-flex items-center justify-center gap-2'
            style={{ borderColor: 'var(--brand-indigo)', color: 'var(--brand-indigo)' }}
          >
            <Save size={14} /> บันทึกร่าง
          </Button>
          <Button
            variant='unstyled'
            type='button'
            disabled={isLocked || saving || !form.formState.isDirty}
            onClick={() => void save()}
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
      </div>
    </div>
  );
}
