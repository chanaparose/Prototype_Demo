import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, History, Lock, Save } from 'lucide-react';

import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';
import { useShippingMethods } from '@/hooks/master/useShippingMethods';
import {
  useQuotationDetailQuery,
  useQuotationHistoryQuery,
} from '@/domain/factory/queries/useQuotationDetailQuery';
import {
  QuotationAuditEditForm,
  type QuotationAuditEditFormHandle,
} from '@/components/factory/QuotationAuditEditForm';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FormSkeleton } from '@/components/common/FormSkeleton';
import { Button } from '@/components/ui/button';

type Raw = Record<string, unknown>;

export function FactoryEditQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const factoryEntityId = getFactoryEntityId(user);
  const formRef = useRef<QuotationAuditEditFormHandle>(null);

  const detailQ = useQuotationDetailQuery(id);
  const historyQ = useQuotationHistoryQuery(id);
  const raw = (detailQ.data ?? {}) as Raw;
  const status = String(raw.status ?? 'PD').toUpperCase();
  const isLocked = Boolean(raw.is_locked) || status === 'AC';
  const version = String(raw.version ?? 1);
  const shippingMethodNameHint = String(raw.shipping_method_name ?? '').trim();

  const shippingMethodsQ = useShippingMethods();
  const lockedShipId = Number(raw.shipping_method_id ?? 0);
  const shipLabel = (() => {
    if (shippingMethodNameHint) return shippingMethodNameHint;
    const row = shippingMethodsQ.data?.find((m) => m.id === lockedShipId);
    return row?.label ?? (lockedShipId > 0 ? `#${lockedShipId}` : '—');
  })();

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useBeforeUnload(isDirty);

  const history = Array.isArray(historyQ.data) ? (historyQ.data as Raw[]) : [];

  if (!id) return null;
  if (detailQ.isError) {
    return (
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600 mb-3'>โหลดใบเสนอราคาไม่สำเร็จ</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void detailQ.refetch()}
          className='px-4 py-2 rounded-xl border text-sm'
        >
          ลองใหม่
        </Button>
      </div>
    );
  }
  if (detailQ.isLoading) return <FormSkeleton sections={2} />;
  if (factoryEntityId == null) {
    return (
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600'>ไม่พบข้อมูลโรงงาน กรุณา login ใหม่</p>
      </div>
    );
  }

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
        {error ? <ErrorAlert>{error}</ErrorAlert> : null}
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

        <QuotationAuditEditForm
          ref={formRef}
          quotationId={id}
          factoryEntityId={factoryEntityId}
          rawQuotation={raw}
          shippingMethodNameHint={shippingMethodNameHint}
          shippingMethodLabel={shipLabel}
          isLocked={isLocked}
          saving={saving}
          onSavingChange={setSaving}
          onSaved={(msg) => {
            setInfo(msg);
            setError('');
          }}
          onError={setError}
          onDirtyChange={setIsDirty}
        />

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
            onClick={() => void formRef.current?.submit()}
            className='flex-1 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-50 inline-flex items-center justify-center gap-2'
            style={{ borderColor: 'var(--brand-indigo)', color: 'var(--brand-indigo)' }}
          >
            <Save size={14} /> บันทึกร่าง
          </Button>
          <Button
            variant='unstyled'
            type='button'
            disabled={isLocked || saving || !isDirty}
            onClick={() => void formRef.current?.submit()}
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
