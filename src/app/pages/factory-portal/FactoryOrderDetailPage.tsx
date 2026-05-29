import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Flag,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Package,
  CalendarClock,
  Handshake,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { openShippingLabel } from '@/utils/printShippingLabel';
import { useQueryClient } from '@tanstack/react-query';
import type { IQuoteNestedResponse, IRfqNestedResponse } from '@/types/api';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatting/formatDate';
import { ordersApi } from '@/services/api/ordersApi';
import { RfqReferenceCard } from '@/components/features/order-detail/RfqReferenceCard';
import { useOrderProductionUpdates } from '@/domain/production/queries/useOrderProductionUpdates';
import { ProductionHeader } from '@/components/features/production/ProductionHeader';
import { ProductionTimeline } from '@/components/features/production/ProductionTimeline';
import {
  UpdateStepDrawer,
  type CustomerShippingInfo,
} from '@/components/features/production/UpdateStepDrawer';
import {
  mergeTemplateWithUpdates,
  type MergedProductionStep,
} from '@/components/features/production/types';
import { deriveStepStates } from '@/components/features/production/stepDerivedState';
import { getStepGuide } from '@/components/features/production/stepGuideConfig';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { Button } from '@/components/ui/button';
import { FactoryNoteInline } from '@/components/factory/FactoryNoteInline';

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className='text-[11px] font-medium text-slate-400 mb-0.5'>{label}</p>
      <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-2xl bg-white border border-slate-200 shadow-sm p-4'>
      <div className='flex items-center gap-2 mb-3'>
        {icon}
        <h2 className='text-sm font-bold text-slate-900'>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function unwrapOrder(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  return asRecord(root.order ?? root);
}

function statusLabel(code: string): string {
  const s = code.toUpperCase();
  if (s === 'PP') return 'รอชำระมัดจำ';
  if (s === 'PE') return 'หมดกำหนดชำระ';
  if (s === 'PD') return 'ชำระแล้ว รอเริ่มผลิต';
  if (s === 'PR') return 'กำลังผลิต';
  if (s === 'QC') return 'ตรวจคุณภาพ';
  if (s === 'SH') return 'จัดส่งแล้ว';
  if (s === 'CP') return 'เสร็จสิ้น';
  if (s === 'CN') return 'ยกเลิก';
  return s || '-';
}

function statusVariant(code: string): React.ComponentProps<typeof StatusBadge>['variant'] {
  const s = code.toUpperCase();
  if (s === 'CP') return 'success';
  if (s === 'CN' || s === 'PE') return 'error';
  if (s === 'SH') return 'info';
  if (s === 'QC' || s === 'PR') return 'active';
  return 'pending';
}

/** คืนจำนวนวันนับจากวันนี้ถึง isoDate (ลบ = เกินกำหนด) */
function daysUntil(isoDate: unknown): number | null {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getStepId(step: MergedProductionStep | null): number {
  if (!step) return 0;
  return Number.isFinite(Number(step.template.step_id ?? 0)) ? Number(step.template.step_id) : 0;
}

function factoryCanUpdateStep(step: MergedProductionStep | null): boolean {
  const n = getStepId(step);
  // step_id=5 "จัดส่งสำเร็จ" รอลูกค้ายืนยัน/14 วัน auto — factory ไม่สามารถแก้ไขได้
  return n >= 0 && n <= 4;
}

function isAcceptStep(step: MergedProductionStep | null): boolean {
  return getStepId(step) === 0;
}

function extractShippingInfo(order: Record<string, unknown>): CustomerShippingInfo {
  const addr =
    (order.delivery_address as Record<string, unknown>) ??
    (order.shipping_address as Record<string, unknown>) ??
    ((order.rfq as Record<string, unknown>)?.address as Record<string, unknown>) ??
    {};

  const buyer =
    (order.buyer as Record<string, unknown>) ?? (order.customer as Record<string, unknown>) ?? {};

  return {
    recipientName:
      String(
        order.customer_name ??
          addr.recipient_name ??
          addr.name ??
          buyer.name ??
          order.buyer_name ??
          '',
      ).trim() || undefined,
    phone:
      String(
        order.customer_phone ?? addr.phone ?? addr.tel ?? buyer.phone ?? order.buyer_phone ?? '',
      ).trim() || undefined,
    addressLine:
      String(addr.address_detail ?? addr.address_line ?? addr.detail ?? '').trim() || undefined,
    subDistrict:
      String(addr.sub_district_name ?? addr.sub_district ?? addr.subdistrict ?? '').trim() ||
      undefined,
    district: String(addr.district_name ?? addr.district ?? '').trim() || undefined,
    province: String(addr.province_name ?? addr.province ?? '').trim() || undefined,
    postalCode: String(addr.zip_code ?? addr.postal_code ?? '').trim() || undefined,
  };
}

type StepState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

function StepStatusBadge({ state, overrideLabel }: { state: StepState; overrideLabel?: string }) {
  const map: Record<
    StepState,
    {
      label: string;
      variant: React.ComponentProps<typeof StatusBadge>['variant'];
      icon: React.ReactNode;
    }
  > = {
    completed: { label: 'เสร็จสิ้น', variant: 'success', icon: <CheckCircle2 size={12} /> },
    active: { label: 'กำลังดำเนินการ', variant: 'active', icon: <Clock size={12} /> },
    blocked: { label: 'รอดำเนินการ', variant: 'pending', icon: <AlertCircle size={12} /> },
    rejected: { label: 'ต้องแก้ไข', variant: 'error', icon: <AlertCircle size={12} /> },
    upcoming: { label: 'ยังไม่เริ่ม', variant: 'inactive', icon: <Circle size={12} /> },
  };
  const { label, variant, icon } = map[state];
  return (
    <StatusBadge variant={variant} size='sm' icon={icon}>
      {overrideLabel ?? label}
    </StatusBadge>
  );
}

interface NextActionCardProps {
  step: MergedProductionStep;
  stepIndex: number;
  totalSteps: number;
  state: StepState;
  customerShipping: CustomerShippingInfo;
  onUpdate: () => void;
  /** เฉพาะ step_id=0: กดยืนยันรับงานโดยไม่ต้องเปิด drawer */
  onAcceptOrder?: () => Promise<void>;
}

function NextActionCard({
  step,
  stepIndex,
  totalSteps,
  state,
  customerShipping,
  onUpdate,
  onAcceptOrder,
}: NextActionCardProps) {
  const [accepting, setAccepting] = React.useState(false);
  const guide = getStepGuide(getStepId(step));
  const canUpdate = factoryCanUpdateStep(step);
  const stepId = getStepId(step);
  const isAccept = isAcceptStep(step);
  const isShipping = stepId === 4; // step 4 = จัดส่งแล้ว (factory ships)
  const isQC = Boolean(step.template.is_payment_trigger);

  const hasAddr =
    customerShipping.addressLine || customerShipping.phone || customerShipping.recipientName;

  return (
    <section className='rounded-2xl overflow-hidden border border-indigo-200 shadow-md'>
      <div className='px-4 py-3 flex items-center justify-between bg-[linear-gradient(135deg,var(--brand-indigo)_0%,var(--brand-violet-deep)_100%)]'>
        <div className='flex items-center gap-2'>
          <span className='text-xl leading-none'>{guide.emoji}</span>
          <div>
            <p className='text-[10px] font-semibold text-indigo-200 uppercase tracking-wide'>
              ขั้นตอนที่ {stepIndex + 1} / {totalSteps}
            </p>
            <p className='text-sm font-bold text-white leading-tight'>
              {step.template.step_name_th}
            </p>
          </div>
        </div>
        {/* step_id=0: แสดง "ยืนยันรับงาน" แทน "กำลังดำเนินการ" */}
        <StepStatusBadge state={state} overrideLabel={isAccept ? 'ยืนยันรับงาน' : undefined} />
      </div>

      <div className='bg-white p-4 space-y-3'>
        <div>
          <p className='text-xs font-bold text-slate-800'>{guide.whatToDo}</p>
          <p className='text-xs text-slate-500 mt-1 leading-relaxed'>{guide.guidance}</p>
        </div>

        {isQC ? (
          <div className='rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2'>
            <span className='text-base leading-none shrink-0 mt-0.5'>💳</span>
            <p className='text-xs text-amber-800'>
              <strong>การยืนยันขั้นนี้จะส่งคำขอชำระเงินส่วนที่เหลือให้ลูกค้าทันที</strong>
            </p>
          </div>
        ) : null}

        {isShipping && hasAddr ? (
          <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5'>
            <p className='text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1'>
              <MapPin size={11} /> ที่อยู่จัดส่ง — สำหรับทำใบปะหน้าพัสดุ
            </p>
            <div className='space-y-1'>
              {customerShipping.recipientName ? (
                <div className='flex items-center gap-1.5'>
                  <User size={11} className='text-amber-600 shrink-0' />
                  <span className='text-xs font-semibold text-amber-900'>
                    {customerShipping.recipientName}
                  </span>
                </div>
              ) : null}
              {customerShipping.phone ? (
                <div className='flex items-center gap-1.5'>
                  <Phone size={11} className='text-amber-600 shrink-0' />
                  <span className='text-xs text-amber-800'>{customerShipping.phone}</span>
                </div>
              ) : null}
              {customerShipping.addressLine ? (
                <div className='flex items-start gap-1.5'>
                  <MapPin size={11} className='text-amber-500 shrink-0 mt-0.5' />
                  <span className='text-xs text-amber-800 leading-relaxed'>
                    {[
                      customerShipping.addressLine,
                      customerShipping.subDistrict,
                      customerShipping.district,
                      customerShipping.province,
                      customerShipping.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <ul className='space-y-1.5'>
          {guide.bulletPoints.slice(0, 3).map((item, i) => (
            <li key={i} className='flex items-start gap-2 text-xs text-gray-700 leading-relaxed'>
              <span className='mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400' />
              {item}
            </li>
          ))}
        </ul>

        <div className='rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center gap-2'>
          <span className='text-sm'>➡️</span>
          <p className='text-[11px] text-slate-500 leading-relaxed'>
            <span className='font-semibold text-slate-700'>เมื่อยืนยัน:</span> {guide.nextStepHint}
          </p>
        </div>

        {canUpdate ? (
          isAccept ? (
            // step_id=0: ยืนยันรับงาน — ไม่ต้องแนบรูป กดปุ่มเลย
            <Button
              variant='unstyled'
              type='button'
              disabled={accepting}
              onClick={async () => {
                if (!onAcceptOrder) return;
                setAccepting(true);
                try {
                  await onAcceptOrder();
                } finally {
                  setAccepting(false);
                }
              }}
              className='w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm bg-[linear-gradient(135deg,var(--brand-indigo)_0%,var(--brand-violet)_100%)] disabled:opacity-60'
            >
              <Package size={16} />
              {accepting ? 'กำลังบันทึก…' : guide.confirmLabel}
            </Button>
          ) : (
            <Button
              variant='unstyled'
              type='button'
              onClick={onUpdate}
              className='w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm bg-[linear-gradient(135deg,var(--brand-indigo)_0%,var(--brand-violet)_100%)]'
            >
              <Package size={16} />
              {step.update.status === 'IP'
                ? 'อัปเดตและยืนยันขั้นนี้'
                : step.update.status === 'RJ'
                  ? 'ส่งหลักฐานใหม่'
                  : guide.confirmLabel}
            </Button>
          )
        ) : (
          <div className='rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-center'>
            <p className='text-xs text-emerald-700 font-medium'>
              ⏳ {step.template.description ?? 'รอการยืนยันจากลูกค้าหรือระบบอัตโนมัติ'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function FactoryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  void fid;
  const qc = useQueryClient();
  const drawerWide = useIsDesktop(768);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Record<string, unknown>>({});
  const [detailTab, setDetailTab] = useState<'order' | 'customer'>('order');

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const detail = await ordersApi.get(id);
      setOrder(unwrapOrder(detail));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดออเดอร์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const updQ = useOrderProductionUpdates(id);

  const merged = useMemo<MergedProductionStep[]>(() => {
    const templateSteps = updQ.data?.template_preview ?? [];
    if (!templateSteps.length || !updQ.data) return [];
    return mergeTemplateWithUpdates(templateSteps, updQ.data.updates);
  }, [updQ.data]);

  const displayMerged = useMemo<MergedProductionStep[]>(
    () =>
      merged.map((m) => {
        const stepId = Number(m.template.step_id ?? 0);
        if (stepId === 4)
          return {
            ...m,
            template: {
              ...m.template,
              step_name_th: 'จัดส่งแล้ว',
              description: 'จัดส่งสินค้าไปยังลูกค้าและบันทึกหลักฐานการจัดส่ง',
            },
          };
        if (stepId === 5)
          return {
            ...m,
            template: {
              ...m.template,
              step_name_th: 'จัดส่งสำเร็จ',
              description: 'รอลูกค้ายืนยันรับสินค้า หรือระบบปิดอัตโนมัติหลัง 14 วัน',
            },
          };
        return m;
      }),
    [merged],
  );

  const orderStatus = updQ.data?.order_status ?? String(order.status ?? '').toUpperCase();
  const timelineMerged = useMemo(
    () =>
      displayMerged.filter((m) => {
        const sid = Number(m.template.step_id ?? 0);
        return Number.isFinite(sid) && sid > 0;
      }),
    [displayMerged],
  );
  const derivedStates = useMemo(
    () => deriveStepStates(displayMerged, orderStatus),
    [displayMerged, orderStatus],
  );

  const activeStepIdx = useMemo(
    () => derivedStates.findIndex((d) => d === 'active' || d === 'blocked'),
    [derivedStates],
  );
  const nextStepIdx = useMemo(() => {
    if (activeStepIdx >= 0) return activeStepIdx;
    return derivedStates.findIndex((d) => d === 'upcoming');
  }, [activeStepIdx, derivedStates]);

  const activeStep = nextStepIdx >= 0 ? (displayMerged[nextStepIdx] ?? null) : null;
  const activeState = (nextStepIdx >= 0 ? derivedStates[nextStepIdx] : null) as StepState | null;

  const [drawerStep, setDrawerStep] = useState<MergedProductionStep | null>(null);

  const handleStepSubmit = useCallback(
    async (
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
    ) => {
      if (!id) return;
      if (Number(body.step_id) > 5)
        throw new Error('ขั้นที่ 6 เป็นขั้นยืนยันรับสินค้าฝั่งลูกค้า/ระบบอัตโนมัติ');
      const headers =
        opts?.confirmPaymentTriggerHeader && body.status === 'CD' && body.confirm_payment_trigger
          ? { 'X-Confirm-Payment-Trigger': 'true' }
          : undefined;
      await ordersApi.postProductionUpdate(id, body, headers);
      await qc.invalidateQueries({ queryKey: ['order', id, 'production-updates'] });
      await qc.invalidateQueries({ queryKey: ['order', id] });
      await loadOrder();
    },
    [id, qc, loadOrder],
  );

  /** step_id=0: ยืนยันรับงาน — ส่ง CD โดยตรง ไม่ต้องรูป */
  const handleAcceptOrder = useCallback(async () => {
    await handleStepSubmit({ step_id: 0, status: 'CD', description: '', image_urls: [] });
  }, [handleStepSubmit]);

  const rfq = order.rfq && typeof order.rfq === 'object' ? (order.rfq as IRfqNestedResponse) : null;
  const quotation =
    order.quotation && typeof order.quotation === 'object'
      ? (order.quotation as IQuoteNestedResponse)
      : null;
  const title = String(
    rfq?.title ?? order.rfq_title ?? order.title ?? order.project_name ?? `คำสั่งซื้อ #${id ?? ''}`,
  );
  const orderCode = String(order.order_no ?? order.order_id ?? id ?? '-');
  const status = String(order.status ?? '').toUpperCase();
  const isCompleted = status === 'CP' || status === 'CN';
  const totalSteps = displayMerged.length;
  const badgeVariant = statusVariant(status);

  /** step_id=0 "ยืนยันรับงาน" — ดึงจาก displayMerged สำหรับแสดง info card */
  const step0 = useMemo(
    () => displayMerged.find((m) => Number(m.template.step_id) === 0) ?? null,
    [displayMerged],
  );
  const step0Accepted = step0?.update.status === 'CD';
  const step0StartDate = step0?.update.completed_at ?? step0?.update.last_updated_at ?? null;
  const deliveryDays = daysUntil(order.estimated_delivery);

  /** step_id=4 "จัดส่งแล้ว" — ใช้แสดงใบปะหน้าพัสดุ */
  const step4 = useMemo(
    () => displayMerged.find((m) => Number(m.template.step_id) === 4) ?? null,
    [displayMerged],
  );
  /**
   * แสดงการ์ดใบปะหน้าเมื่อ step 4 อยู่ในสถานะ "กำลังดำเนินการ" (IP) เท่านั้น
   * เมื่อขั้นจัดส่งถูกยืนยันเสร็จสิ้น (CD) จะซ่อนการ์ดใบปะหน้า
   */
  const showLabelCard = useMemo(() => {
    if (step4 === null) return false;
    return step4.update.status === 'IP';
  }, [step4]);

  /** ชื่อโรงงาน (ผู้ส่ง) */
  const senderName = String(
    (order.factory as Record<string, unknown>)?.factory_name ??
      (order.factory as Record<string, unknown>)?.name ??
      user?.company ??
      user?.name ??
      'โรงงาน Tryly',
  ).trim();

  /** เบอร์โทรโรงงาน (ผู้ส่ง) จาก factory.phone ที่ API ส่งมา */
  const senderPhone =
    String((order.factory as Record<string, unknown>)?.phone ?? '').trim() || undefined;

  /** ที่อยู่โรงงาน (จังหวัด) */
  const senderAddress =
    String((order.factory as Record<string, unknown>)?.address ?? '').trim() || undefined;

  /** Tracking number จาก description ของ step 4 (ถ้ามี) */
  const trackingNumber = step4?.update.description
    ? (step4.update.description.match(
        /(?:tracking|เลขพัสดุ|เลขติดตาม)[:\s#]*([A-Z0-9\-]{6,})/i,
      )?.[1] ?? undefined)
    : undefined;

  const customerShipping = useMemo(() => extractShippingInfo(order), [order]);
  const completedCount = derivedStates.filter((s) => s === 'completed').length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const customerName = String(
    (order.customer as Record<string, unknown>)?.display_name ??
      (order.buyer as Record<string, unknown>)?.name ??
      customerShipping.recipientName ??
      '-',
  );
  const customerPhone = String(
    (order.customer as Record<string, unknown>)?.phone ?? customerShipping.phone ?? '-',
  );
  const shippingMethodName = String(
    (order.shipping_method as Record<string, unknown>)?.method_name ??
      order.shipping_method_name ??
      rfq?.shipping_method_name ??
      '-',
  );
  const fullShippingAddress = [
    customerShipping.addressLine,
    customerShipping.subDistrict,
    customerShipping.district,
    customerShipping.province,
    customerShipping.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  const handleOpenLabel = useCallback(() => {
    openShippingLabel({
      recipientName: customerShipping.recipientName,
      recipientPhone: customerShipping.phone,
      addressLine: customerShipping.addressLine,
      subDistrict: customerShipping.subDistrict,
      district: customerShipping.district,
      province: customerShipping.province,
      postalCode: customerShipping.postalCode,
      senderName,
      senderPhone,
      senderAddress,
      orderCode,
      orderTitle: title,
      trackingNumber,
    });
  }, [customerShipping, senderName, senderPhone, senderAddress, orderCode, title, trackingNumber]);

  if (!id) return null;

  return (
    <div className='space-y-4 pb-24'>
      <header className='sticky top-0 z-[99999] -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 -mt-4 sm:-mt-5 lg:-mt-6 flex w-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'>
        <div className='flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory/orders')}
            className='flex shrink-0 items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ChevronLeft size={18} />
            กลับ
          </Button>
        </div>
      </header>

      <div className='w-full max-w-7xl mx-auto'>
        {error ? <ErrorAlert className='mb-4'>{error}</ErrorAlert> : null}

        {loading && !order.status ? (
          <div className='flex justify-center py-16'>
            <div className='w-10 h-10 border-3 border-brand-indigo border-t-transparent rounded-full animate-spin' />
          </div>
        ) : (
          <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_550px] gap-4 lg:gap-5 items-start'>
            <div className='space-y-4 min-w-0'>
              <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <div className='flex items-start justify-between gap-2 mb-3'>
                  <div className='min-w-0'>
                    <h2 className='text-base font-bold text-slate-900 truncate'>{title}</h2>
                    <p className='text-xs text-slate-400 mt-0.5'>#{orderCode}</p>
                  </div>
                  <StatusBadge variant={badgeVariant} size='md' className='shrink-0'>
                    {statusLabel(status)}
                  </StatusBadge>
                </div>

                {totalSteps > 0 ? (
                  <div className='mb-4'>
                    <div className='flex items-center justify-between text-xs text-slate-500 mb-1.5'>
                      <span>ความคืบหน้า</span>
                      <span className='font-semibold text-indigo-700'>
                        {progressPct}% ({completedCount}/{totalSteps} ขั้นตอน)
                      </span>
                    </div>
                    <div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
                      <progress
                        className='block h-full w-full appearance-none rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand-indigo [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-brand-indigo'
                        value={progressPct}
                        max={100}
                        aria-label='ความคืบหน้าการผลิต'
                      />
                    </div>
        </div>
      ) : null}

                <div className='grid grid-cols-3 gap-3'>
                  <div className='rounded-xl bg-slate-50 px-3 py-2.5'>
                    <p className='text-[10px] text-slate-500 uppercase tracking-wide'>มูลค่ารวม</p>
                    <p className='font-bold text-slate-900 text-sm mt-0.5'>
                      {formatCurrency(Number(order.total_amount ?? 0))}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-50 px-3 py-2.5'>
                    <p className='text-[10px] text-slate-500 uppercase tracking-wide'>ชำระแล้ว</p>
                    <p className='font-bold text-emerald-700 text-sm mt-0.5'>
                      {formatCurrency(Number(order.total_amount ?? order.deposit_amount ?? 0))}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-50 px-3 py-2.5'>
                    <p className='text-[10px] text-slate-500 uppercase tracking-wide'>กำหนดส่ง</p>
                    <p className='font-bold text-slate-900 text-sm mt-0.5'>
                      {formatDate(order.estimated_delivery as string | Date | null | undefined)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Tabbed detail card ── */}
              <div className='rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
                {/* Tab row */}
                <div
                  className='flex overflow-x-auto [&::-webkit-scrollbar]:hidden border-b border-slate-100'
                  style={{ scrollbarWidth: 'none' }}
                  role='tablist'
                >
                  {(
                    [
                      { id: 'order', label: 'ข้อมูล RFQ & คำสั่งซื้อ' },
                      { id: 'customer', label: 'ลูกค้า & จัดส่ง' },
                    ] as const
                  ).map((t) => {
                    const on = detailTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type='button'
                        role='tab'
                        aria-selected={on}
                        onClick={() => setDetailTab(t.id)}
                        className='flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-5 py-3.5 text-[13px] -mb-px transition-colors focus:outline-none'
                        style={{
                          borderBottomColor: on ? 'var(--brand-indigo)' : 'transparent',
                          color: on ? 'var(--brand-indigo)' : '#64748b',
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab: ข้อมูล RFQ & คำสั่งซื้อ */}
                {detailTab === 'order' ? (
                  <div className='divide-y divide-slate-100'>
                    {/* Formal info table */}
                    <table className='w-full text-sm'>
                      <tbody className='divide-y divide-slate-100'>
                        {[
                          { label: 'Order No.', value: <span className='font-mono font-semibold text-indigo-600'>#{orderCode}</span> },
                          { label: 'สถานะ', value: <StatusBadge variant={badgeVariant} size='sm'>{statusLabel(status)}</StatusBadge> },
                          { label: 'วันที่สั่งซื้อ', value: formatDateTime(order.created_at as string | Date | null | undefined) },
                          { label: 'กำหนดส่งสินค้า', value: formatDateTime(order.estimated_delivery as string | Date | null | undefined) },
                          { label: 'มูลค่ารวม', value: <span className='font-semibold tabular-nums'>{formatCurrency(Number(order.total_amount ?? 0))}</span> },
                          { label: 'มัดจำ (Deposit)', value: <span className='font-semibold tabular-nums text-emerald-700'>{formatCurrency(Number(order.deposit_amount ?? 0))}</span> },
                          { label: 'วิธีจัดส่ง', value: shippingMethodName },
                          ...(trackingNumber ? [{ label: 'Tracking No.', value: <span className='font-mono bg-slate-100 rounded px-2 py-0.5 text-xs'>{trackingNumber}</span> }] : []),
                        ].map(({ label, value }, i) => (
                          <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className='px-4 py-2.5 text-[12px] font-medium text-slate-500 w-[40%] align-middle'>
                              {label}
                            </td>
                            <td className='px-4 py-2.5 text-[13px] text-slate-800 align-middle'>
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* RFQ reference — inline inside tab */}
                    {rfq ? (
                      <div className='px-4 py-3 bg-slate-50/40'>
                        <RfqReferenceCard rfq={rfq} variant='accordion' collapsible={false} />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Tab: ลูกค้า & จัดส่ง */}
                {detailTab === 'customer' ? (
                  <div className='divide-y divide-slate-100'>
                    <table className='w-full text-sm'>
                      <tbody className='divide-y divide-slate-100'>
                        {[
                          { label: 'ชื่อลูกค้า', value: customerName || '-' },
                          { label: 'เบอร์โทร', value: customerPhone || '-' },
                          { label: 'วิธีจัดส่ง', value: shippingMethodName },
                        ].map(({ label, value }, i) => (
                          <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className='px-4 py-2.5 text-[12px] font-medium text-slate-500 w-[40%] align-middle'>
                              {label}
                            </td>
                            <td className='px-4 py-2.5 text-[13px] text-slate-800 align-middle'>
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* ที่อยู่จัดส่ง */}
                    <div className='px-4 py-3 bg-slate-50/40'>
                      <p className='text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5'>
                        <MapPin size={11} className='text-indigo-500' /> ที่อยู่จัดส่ง
                      </p>
                      {fullShippingAddress ? (
                        <div className='space-y-1'>
                          {customerShipping.recipientName ? (
                            <div className='flex items-center gap-2'>
                              <User size={13} className='text-slate-400 shrink-0' />
                              <span className='text-sm font-semibold text-slate-800'>{customerShipping.recipientName}</span>
                            </div>
                          ) : null}
                          {customerShipping.phone ? (
                            <div className='flex items-center gap-2'>
                              <Phone size={13} className='text-slate-400 shrink-0' />
                              <span className='text-sm text-slate-700'>{customerShipping.phone}</span>
                            </div>
                          ) : null}
                          <div className='flex items-start gap-2 mt-1'>
                            <MapPin size={13} className='text-slate-400 shrink-0 mt-0.5' />
                            <span className='text-sm text-slate-700 leading-relaxed'>{fullShippingAddress}</span>
                          </div>
                        </div>
                      ) : (
                        <p className='text-sm text-slate-400'>ยังไม่มีข้อมูลที่อยู่จัดส่ง</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ── Factory Note — always editable ── */}
              {quotation?.quote_id ? (
                <FactoryNoteInline
                  quotationId={quotation.quote_id}
                  initialNote={quotation.factory_note}
                  onSaved={loadOrder}
                />
              ) : null}
            </div>

            <aside className='space-y-4 xl:sticky xl:top-20'>
              {isCompleted ? (
                <section className='rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-1'>
                  <p className='text-2xl'>🎉</p>
                  <p className='text-sm font-bold text-emerald-800'>ออเดอร์นี้เสร็จสิ้นแล้ว</p>
                  <p className='text-xs text-emerald-600'>ขอบคุณที่ดำเนินการเสร็จสิ้น</p>
                </section>
              ) : activeStep != null && totalSteps > 0 ? (
                <NextActionCard
                  step={activeStep}
                  stepIndex={nextStepIdx}
                  totalSteps={totalSteps}
                  state={activeState ?? 'upcoming'}
                  customerShipping={customerShipping}
                  onAcceptOrder={handleAcceptOrder}
                  onUpdate={() => {
                    if (factoryCanUpdateStep(activeStep) && !isAcceptStep(activeStep))
                      setDrawerStep(activeStep);
                  }}
                />
              ) : totalSteps > 0 ? (
                <section className='rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-center'>
                  <p className='text-sm text-gray-500'>ทุกขั้นตอนเสร็จสิ้น — รอลูกค้ายืนยัน</p>
                </section>
              ) : (
                <section className='rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-center'>
                  <p className='text-sm text-gray-400'>กำลังโหลดขั้นตอน…</p>
                </section>
              )}

              {/* ── ใบปะหน้าพัสดุ (แสดงเมื่อถึง step 4) ── */}
              {showLabelCard ? (
                <section className='rounded-2xl overflow-hidden border border-orange-200 shadow-sm'>
                  {/* header */}
                  <div className='px-4 py-2.5 flex items-center gap-2 bg-[#ee4d2d]'>
                    <Printer size={15} className='text-white' />
                    <p className='text-sm font-bold text-white flex-1'>ใบปะหน้าพัสดุ</p>
                    {step4?.update.status === 'CD' ? (
                      <span className='text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full'>
                        จัดส่งแล้ว
                      </span>
                    ) : (
                      <span className='text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full'>
                        พร้อมพิมพ์
                      </span>
                    )}
                  </div>

                  {/* body */}
                  <div className='bg-white px-4 py-3 space-y-3'>
                    {/* recipient preview */}
                    <div className='rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5'>
                      <p className='text-[9px] font-bold text-orange-600 uppercase tracking-wide mb-1.5'>
                        ผู้รับ
                      </p>
                      <p className='text-sm font-bold text-slate-900 leading-tight'>
                        {customerShipping.recipientName || (
                          <span className='text-slate-400 font-normal'>ไม่ระบุชื่อ</span>
                        )}
                      </p>
                      {customerShipping.phone ? (
                        <p className='text-xs text-slate-700 mt-0.5'>📞 {customerShipping.phone}</p>
                      ) : null}
                      {customerShipping.addressLine ? (
                        <p className='text-[11px] text-slate-600 mt-1 leading-relaxed'>
                          {[
                            customerShipping.addressLine,
                            customerShipping.subDistrict,
                            customerShipping.district,
                            customerShipping.province,
                            customerShipping.postalCode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      ) : (
                        <p className='text-[11px] text-slate-400 mt-1'>ยังไม่มีที่อยู่จัดส่ง</p>
                      )}
                    </div>

                    {/* tracking chip if exists */}
                    {trackingNumber ? (
                      <div className='flex items-center gap-1.5'>
                        <span className='text-xs'>📦</span>
                        <span className='text-xs font-semibold text-slate-700 bg-slate-100 rounded px-2 py-0.5'>
                          {trackingNumber}
                        </span>
                      </div>
      ) : null}

                    {/* print button */}
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={handleOpenLabel}
                      className='w-full rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 bg-[#ee4d2d] hover:opacity-90 transition-opacity'
                    >
                      <Printer size={15} />
                      ทำใบปะหน้าพัสดุ
                      <ExternalLink size={13} className='opacity-70' />
                    </Button>
                    <p className='text-[10px] text-slate-400 text-center'>
                      เปิด tab ใหม่ • พิมพ์หรือบันทึก PDF ได้เลย
                    </p>
              </div>
            </section>
              ) : null}

              <section className='rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3'>
                <div className='flex items-center gap-2'>
                  <Flag size={14} className='text-indigo-600' />
                  <h2 className='text-sm font-bold text-slate-900'>ความคืบหน้าการผลิต</h2>
                </div>

                {updQ.isLoading ? (
                  <div className='flex items-center gap-2 py-6 justify-center text-gray-500 text-sm'>
                    <div className='w-5 h-5 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin' />
                    กำลังโหลด…
                  </div>
                ) : merged.length === 0 ? (
                  <p className='text-sm text-gray-400 px-1'>ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>
                ) : (
                  <>
                    {/* step_id=0: แสดง info card แทน StepRow */}
                    {step0Accepted ? (
                      <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <Handshake size={16} className='shrink-0 text-emerald-600' />
                          <div className='min-w-0'>
                            <p className='text-[11px] font-bold text-emerald-800'>รับงานแล้ว</p>
                            {step0StartDate ? (
                              <p className='text-[11px] text-emerald-700 mt-0.5'>
                                เริ่ม {formatDate(step0StartDate)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {order.estimated_delivery ? (
                          <div className='text-right shrink-0'>
                            <div className='flex items-center gap-1 justify-end'>
                              <CalendarClock size={11} className='text-slate-500' />
                              <p className='text-[10px] text-slate-500'>กำหนดส่ง</p>
                            </div>
                            <p className='text-xs font-bold text-slate-800'>
                              {formatDate(order.estimated_delivery as string)}
                            </p>
                            {deliveryDays !== null ? (
                              <p
                                className={`text-[10px] font-bold ${
                                  deliveryDays > 7
                                    ? 'text-emerald-700'
                                    : deliveryDays >= 0
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {deliveryDays > 0
                                  ? `เหลืออีก ${deliveryDays} วัน`
                                  : deliveryDays === 0
                                    ? 'วันนี้!'
                                    : `เกินกำหนด ${Math.abs(deliveryDays)} วัน`}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : !step0Accepted && order.estimated_delivery ? (
                      /* ยังไม่รับงาน: แสดง estimated_delivery อย่างเดียว */
                      <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-1.5'>
                          <CalendarClock size={14} className='text-slate-500' />
                          <p className='text-xs text-slate-600'>กำหนดส่ง</p>
                        </div>
                        <div className='text-right'>
                          <p className='text-xs font-bold text-slate-800'>
                            {formatDate(order.estimated_delivery as string)}
                          </p>
                          {deliveryDays !== null ? (
                            <p
                              className={`text-[10px] font-semibold ${
                                deliveryDays > 7
                                  ? 'text-slate-500'
                                  : deliveryDays >= 0
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {deliveryDays > 0
                                ? `เหลืออีก ${deliveryDays} วัน`
                                : deliveryDays === 0
                                  ? 'วันนี้!'
                                  : `เกินกำหนด ${Math.abs(deliveryDays)} วัน`}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {timelineMerged.length === 0 ? (
                      <p className='text-sm text-gray-400 px-1'>
                        รอยืนยันรับงานเพื่อเริ่มขั้นตอนการผลิต
                      </p>
                    ) : (
                      <>
                        <ProductionHeader merged={timelineMerged} orderStatus={orderStatus} />
                        <ProductionTimeline
                          merged={timelineMerged}
                          orderStatus={orderStatus}
                          isFactory={!isCompleted}
                          isCustomer={false}
                          onOpenDrawer={(m) => {
                            if (!isCompleted && factoryCanUpdateStep(m)) setDrawerStep(m);
                          }}
                          onOpenReject={() => undefined}
                          onPhotoClick={() => undefined}
                        />
                      </>
                    )}
                  </>
                )}
              </section>
            </aside>
          </div>
        )}
        </div>

      <UpdateStepDrawer
        open={drawerStep != null}
        placement={drawerWide ? 'right' : 'bottom'}
        step={drawerStep}
        onClose={() => setDrawerStep(null)}
        onSubmit={handleStepSubmit}
        customerShipping={customerShipping}
      />
    </div>
  );
}
