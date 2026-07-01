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
  Truck,
  X,
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
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { Button } from '@/components/ui/button';
import { FactoryNoteInline } from '@/components/factory/FactoryNoteInline';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { FactoryStatusBadge } from '@/pages/factory-portal/components/FactoryStatusBadge';
import {
  factoryBoxClass,
  factoryButtonClass,
  factoryBadgeClass,
  factoryInputClass,
} from '@/pages/factory-portal/factoryUi';

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
    <section className='rounded-md bg-white border border-slate-200 p-4'>
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
  if (s === 'WS') return 'รอแนบสลิป';
  if (s === 'WA') return 'รอยืนยันสลิป';
  if (s === 'PP') return 'รอชำระเงิน';
  if (s === 'PE') return 'หมดกำหนดชำระ';
  if (s === 'PD') return 'ต้องดำเนินการ';
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

function StartWorkButton({ onStart }: { onStart: () => Promise<void> }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant='unstyled'
      type='button'
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onStart();
        } finally {
          setBusy(false);
        }
      }}
      className={factoryButtonClass({ variant: 'primary', size: 'md', className: 'w-full' })}
    >
      {busy ? 'กำลังดำเนินการ...' : 'เริ่มงาน'}
    </Button>
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
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['order', id, 'production-updates'] }),
        qc.invalidateQueries({ queryKey: ['order', id] }),
      ]);
    },
    [id, qc],
  );

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
  /** courier/tracking จาก orders.* (primary) + fallback จาก step4 description */
  const trackingFromOrder = String(
    (order as Record<string, unknown>).tracking_no ??
      (order as Record<string, unknown>).trackingNo ??
      '',
  ).trim();
  const courierFromOrder = String(
    (order as Record<string, unknown>).courier ??
      (order as Record<string, unknown>).shipping_courier ??
      '',
  ).trim();
  const courierFromDesc = step4?.update.description
    ? (step4.update.description
        .match(/(?:courier|ขนส่ง|บริษัทขนส่ง)[:\s]*([^\n,]+)/i)?.[1]
        ?.trim() ?? '')
    : '';
  const shippedTrackingNo = trackingFromOrder || trackingNumber || '';
  const shippedCourier = courierFromOrder || courierFromDesc || '';

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
  const requestKindRaw = String(
    order.request_kind ??
      (order.rfq as Record<string, unknown> | null)?.request_kind ??
      (order.quotation as Record<string, unknown> | null)?.request_kind ??
      '',
  ).toUpperCase();
  const requestKindLabel: Record<string, string> = {
    PR: 'ผลิต OEM',
    MR: 'วัตถุดิบ',
    PS: 'ตัวอย่างสินค้า',
    MS: 'ตัวอย่างวัตถุดิบ',
  };
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
      <header className='sticky top-0 z-[99999] -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 2xl:-mx-10 -mt-4 sm:-mt-5 lg:-mt-6 flex w-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] 2xl:w-[calc(100%+5rem)] border-b border-slate-200 bg-white/95 backdrop-blur'>
        <div className='flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory/orders')}
            className='flex shrink-0 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors'
          >
            <ChevronLeft size={18} />
            กลับ
          </Button>
          <div className='hidden sm:flex items-center gap-2 text-xs text-slate-500'>
            <Package size={14} className='text-brand-purple' />
            <span>Factory / Orders</span>
          </div>
        </div>
      </header>

      <div className='w-full max-w-[1500px] mx-auto space-y-4'>
        {error ? <ErrorAlert className='mb-4'>{error}</ErrorAlert> : null}

        {loading && !order.status ? (
          <div className='flex justify-center py-16'>
            <div className='w-10 h-10 border-3 border-brand-purple border-t-transparent rounded-full animate-spin' />
          </div>
        ) : (
          <>
            <FactoryPageHeader
              title={title}
              subtitle={`คำสั่งซื้อ #${orderCode}`}
              icon={Package}
              count={statusLabel(status)}
            />

            {(isCompleted || showLabelCard || step4?.update.status === 'CD') && (
              <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_550px] 2xl:grid-cols-[minmax(0,1fr)_600px] gap-4 lg:gap-5 mb-4 items-start'>
                {isCompleted ? (
                  <section className='rounded-md bg-emerald-50 border border-emerald-200 p-5 text-center space-y-2 flex flex-col items-center justify-center min-h-[200px]'>
                    <CheckCircle2 size={32} className='text-emerald-600' />
                    <p className='text-base font-bold text-emerald-800'>ออเดอร์นี้เสร็จสิ้นแล้ว</p>
                    <p className='text-sm text-emerald-600'>ขอบคุณที่ดำเนินการเสร็จสิ้น</p>
                    <p className='text-sm text-emerald-600'>และจัดส่งแล้ว</p>
                  </section>
                ) : (
                  <div />
                )}

                {showLabelCard ? (
                  <section className='rounded-md overflow-hidden border border-slate-200 bg-white'>
                    <div className='px-4 py-2.5 flex items-center gap-2 bg-brand-purple'>
                      <Printer size={15} className='text-white' />
                      <p className='text-sm font-bold text-white flex-1'>ใบปะหน้าพัสดุ</p>
                      <span className='text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full'>
                        พร้อมพิมพ์
                      </span>
                    </div>
                    <div className='bg-white px-4 py-3 space-y-3'>
                      <div className='rounded-md border border-slate-200 bg-[var(--brand-page)] px-3 py-2.5'>
                        <p className='text-[9px] font-bold text-orange-600 uppercase tracking-wide mb-1.5'>
                          ผู้รับ
                        </p>
                        <p className='text-sm font-bold text-slate-900 leading-tight'>
                          {customerShipping.recipientName || (
                            <span className='text-slate-400 font-normal'>ไม่ระบุชื่อ</span>
                          )}
                        </p>
                        {customerShipping.phone ? (
                          <p className='mt-0.5 flex items-center gap-1 text-xs text-slate-700'>
                            <Phone size={12} />
                            {customerShipping.phone}
                          </p>
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
                      {trackingNumber ? (
                        <div className='flex items-center gap-1.5'>
                          <Package size={13} className='text-slate-500' />
                          <span className='text-xs font-semibold text-slate-700 bg-slate-100 rounded px-2 py-0.5'>
                            {trackingNumber}
                          </span>
                        </div>
                      ) : null}
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={handleOpenLabel}
                        className={factoryButtonClass({
                          variant: 'primary',
                          size: 'md',
                          className: 'w-full justify-center gap-2',
                        })}
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
                ) : step4?.update.status === 'CD' ? (
                  <section className='rounded-md overflow-hidden border border-slate-200 bg-white'>
                    <div className='px-4 py-2.5 flex items-center gap-2 bg-emerald-50/80'>
                      <Truck size={15} className='text-emerald-700' />
                      <p className='text-sm font-bold text-emerald-800 flex-1'>จัดส่งแล้ว</p>
                      <span className='text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200'>
                        CD
                      </span>
                    </div>
                    <div className='px-4 py-3 space-y-2.5'>
                      <div className='rounded-md border border-slate-200 bg-[var(--brand-page)] px-3 py-2.5'>
                        <p className='text-[10px] text-slate-500 mb-1'>บริษัทขนส่ง</p>
                        <p className='text-sm font-semibold text-slate-900'>
                          {shippedCourier || <span className='text-slate-400 font-normal'>-</span>}
                        </p>
                      </div>
                      <div className='rounded-md border border-slate-200 bg-[var(--brand-page)] px-3 py-2.5'>
                        <p className='text-[10px] text-slate-500 mb-1'>เลขพัสดุ</p>
                        <p className='text-sm font-semibold text-slate-900 font-mono break-all'>
                          {shippedTrackingNo || (
                            <span className='text-slate-400 font-sans font-normal'>-</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </section>
                ) : (
                  <div />
                )}
              </div>
            )}
            <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_550px] 2xl:grid-cols-[minmax(0,1fr)_600px] gap-4 lg:gap-5 items-start'>
              <div className='space-y-4 min-w-0'>
                <div className='rounded-md border border-slate-200 bg-white p-5'>
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
                        <span className='font-semibold text-brand-purple'>
                          {progressPct}% ({completedCount}/{totalSteps} ขั้นตอน)
                        </span>
                      </div>
                      <div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
                        <progress
                          className='block h-full w-full appearance-none rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand-purple [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-brand-purple'
                          value={progressPct}
                          max={100}
                          aria-label='ความคืบหน้าการผลิต'
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className='grid grid-cols-3 gap-3'>
                    <div className='rounded-md bg-[var(--brand-page)] px-3 py-2.5'>
                      <p className='text-[10px] text-slate-500 uppercase tracking-wide'>
                        มูลค่ารวม
                      </p>
                      <p className='font-bold text-slate-900 text-sm mt-0.5'>
                        {formatCurrency(Number(order.total_amount ?? 0))}
                      </p>
                    </div>
                    <div className='rounded-md bg-[var(--brand-page)] px-3 py-2.5'>
                      <p className='text-[10px] text-slate-500 uppercase tracking-wide'>ชำระแล้ว</p>
                      <p className='font-bold text-emerald-700 text-sm mt-0.5'>
                        {formatCurrency(Number(order.total_amount ?? order.deposit_amount ?? 0))}
                      </p>
                    </div>
                    <div className='rounded-md bg-[var(--brand-page)] px-3 py-2.5'>
                      <p className='text-[10px] text-slate-500 uppercase tracking-wide'>กำหนดส่ง</p>
                      <p className='font-bold text-slate-900 text-sm mt-0.5'>
                        {formatDate(order.estimated_delivery as string | Date | null | undefined)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Tabbed detail card ── */}
                <div className='rounded-md border border-slate-200 bg-white overflow-hidden'>
                  {/* Tab row */}
                  <div
                    className='flex overflow-x-auto [&::-webkit-scrollbar]:hidden border-b border-slate-100 bg-[var(--brand-page)]/50'
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
                          className='flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] -mb-px transition-colors focus:outline-none'
                          style={{
                            borderBottomColor: on ? 'var(--brand-purple)' : 'transparent',
                            color: on ? 'var(--brand-purple)' : '#64748b',
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
                            {
                              label: 'Order No.',
                              value: (
                                <span className='font-mono font-semibold text-brand-purple'>
                                  #{orderCode}
                                </span>
                              ),
                            },
                            {
                              label: 'สถานะ',
                              value: (
                                <StatusBadge variant={badgeVariant} size='sm'>
                                  {statusLabel(status)}
                                </StatusBadge>
                              ),
                            },
                            {
                              label: 'วันที่สั่งซื้อ',
                              value: formatDateTime(
                                order.created_at as string | Date | null | undefined,
                              ),
                            },
                            {
                              label: 'กำหนดส่งสินค้า',
                              value: formatDateTime(
                                order.estimated_delivery as string | Date | null | undefined,
                              ),
                            },
                            {
                              label: 'มูลค่ารวม',
                              value: (
                                <span className='font-semibold tabular-nums'>
                                  {formatCurrency(Number(order.total_amount ?? 0))}
                                </span>
                              ),
                            },
                            {
                              label: 'มัดจำ (Deposit)',
                              value: (
                                <span className='font-semibold tabular-nums text-emerald-700'>
                                  {formatCurrency(Number(order.deposit_amount ?? 0))}
                                </span>
                              ),
                            },
                            { label: 'วิธีจัดส่ง', value: shippingMethodName },
                            ...(requestKindRaw && requestKindLabel[requestKindRaw]
                              ? [
                                  {
                                    label: 'ประเภทออเดอร์',
                                    value: (
                                      <FactoryStatusBadge tone='brand'>
                                        {requestKindLabel[requestKindRaw]}
                                      </FactoryStatusBadge>
                                    ),
                                  },
                                ]
                              : []),
                            ...(trackingNumber
                              ? [
                                  {
                                    label: 'Tracking No.',
                                    value: (
                                      <span
                                        className={factoryBadgeClass({ variant: 'meta' })}
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {trackingNumber}
                                      </span>
                                    ),
                                  },
                                ]
                              : []),
                          ].map(({ label, value }, i) => (
                            <tr
                              key={label}
                              className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--brand-page)]/40'}
                            >
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
                        <div className='px-4 py-3 bg-[var(--brand-page)]/35'>
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
                            <tr
                              key={label}
                              className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--brand-page)]/40'}
                            >
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
                      <div className='px-4 py-3 bg-[var(--brand-page)]/35'>
                        <p className='text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5'>
                          <MapPin size={11} className='text-brand-purple' /> ที่อยู่จัดส่ง
                        </p>
                        {fullShippingAddress ? (
                          <div className='space-y-1'>
                            {customerShipping.recipientName ? (
                              <div className='flex items-center gap-2'>
                                <User size={13} className='text-slate-400 shrink-0' />
                                <span className='text-sm font-semibold text-slate-800'>
                                  {customerShipping.recipientName}
                                </span>
                              </div>
                            ) : null}
                            {customerShipping.phone ? (
                              <div className='flex items-center gap-2'>
                                <Phone size={13} className='text-slate-400 shrink-0' />
                                <span className='text-sm text-slate-700'>
                                  {customerShipping.phone}
                                </span>
                              </div>
                            ) : null}
                            <div className='flex items-start gap-2 mt-1'>
                              <MapPin size={13} className='text-slate-400 shrink-0 mt-0.5' />
                              <span className='text-sm text-slate-700 leading-relaxed'>
                                {fullShippingAddress}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className='text-sm text-slate-400'>ยังไม่มีข้อมูลที่อยู่จัดส่ง</p>
                        )}
                      </div>

                      {/* ── ประวัติการชำระเงิน ── */}
                      <div className='px-4 py-4'>
                        <PaymentTransactionsTable orderId={String(order.order_id ?? id)} />
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
                <section className='rounded-md bg-white border border-slate-200 p-4 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Flag size={14} className='text-brand-purple' />
                    <h2 className='text-sm font-bold text-slate-900'>ความคืบหน้าการผลิต</h2>
                  </div>

                  {/* ── สลิปการโอนเงิน — ต้องยืนยันก่อนเริ่มงาน ── */}
                  <SlipVerificationCard
                    orderId={String(order.order_id ?? id)}
                    orderStatus={status}
                    onStatusChange={() => {
                      setError('');
                      loadOrder();
                    }}
                  />

                  {updQ.isLoading ? (
                    <div className='flex items-center gap-2 py-6 justify-center text-gray-500 text-sm'>
                      <div className='w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin' />
                      กำลังโหลด…
                    </div>
                  ) : merged.length === 0 ? (
                    <p className='text-sm text-gray-400 px-1'>ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>
                  ) : (
                    <>
                      {/* step_id=0: แสดง info card แทน StepRow */}
                      {!step0Accepted && status === 'PD' && (
                        <StartWorkButton
                          onStart={() =>
                            handleStepSubmit({ step_id: 0, status: 'CD', image_urls: [] })
                          }
                        />
                      )}
                      {step0Accepted ? (
                        <div className='rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 flex items-center justify-between gap-2'>
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
                        <div className='rounded-md border border-slate-200 bg-[var(--brand-page)] px-3 py-2 flex items-center justify-between gap-2'>
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
          </>
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

/* ── Slip Verification Card (Factory approves/rejects customer slip) ── */

function slipStatusConfig(s: string) {
  const code = s.toUpperCase();
  if (code === 'AP')
    return {
      label: 'ยืนยันแล้ว',
      tone: 'success' as const,
      box: 'emerald' as const,
      icon: 'text-emerald-600',
      title: 'text-emerald-800',
    };
  if (code === 'RJ')
    return {
      label: 'ปฏิเสธแล้ว',
      tone: 'danger' as const,
      box: 'neutral' as const,
      icon: 'text-red-600',
      title: 'text-red-700',
    };
  if (code === 'PE')
    return {
      label: 'รอลูกค้าแนบสลิป',
      tone: 'neutral' as const,
      box: 'neutral' as const,
      icon: 'text-slate-400',
      title: 'text-slate-600',
    };
  return {
    label: 'รอตรวจสอบ',
    tone: 'warning' as const,
    box: 'amber' as const,
    icon: 'text-amber-600',
    title: 'text-amber-800',
  };
}

function SlipVerificationCard({
  orderId,
  orderStatus,
  onStatusChange,
}: {
  orderId: string | number;
  orderStatus: string;
  onStatusChange: () => void;
}) {
  const [slipData, setSlipData] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const fetchSlip = React.useCallback(async () => {
    try {
      const { slipApi } = await import('@/services/api/adminApi');
      const res = await slipApi.getInfo(Number(orderId));
      setSlipData(res as unknown as Record<string, unknown>);
    } catch {
      setSlipData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    void fetchSlip();
  }, [fetchSlip]);

  const slipStatus = String(slipData?.slip_status ?? '')
    .trim()
    .toUpperCase();

  // ไม่แสดงอะไรเลยถ้ายังโหลดอยู่ หรือไม่มี slip data หรือสถานะว่าง
  if (loading || !slipData || !slipStatus) return null;

  const cfg = slipStatusConfig(slipStatus);
  const isPending = slipStatus === 'ST';
  const isApproved = slipStatus === 'AP';
  const isRejected = slipStatus === 'RJ';
  const isWaiting = slipStatus === 'PE';

  const handleApprove = async () => {
    if (acting) return;
    setActing(true);
    try {
      const { slipApi } = await import('@/services/api/adminApi');
      await slipApi.verify(Number(orderId), 'approve');
      onStatusChange();
      void fetchSlip();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'approve ไม่สำเร็จ';
      alert(msg);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (acting || rejectReason.trim().length < 5) return;
    setActing(true);
    try {
      const { slipApi } = await import('@/services/api/adminApi');
      await slipApi.verify(Number(orderId), 'reject', rejectReason.trim());
      setShowRejectInput(false);
      setRejectReason('');
      onStatusChange();
      void fetchSlip();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'reject ไม่สำเร็จ';
      alert(msg);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className={factoryBoxClass({ variant: cfg.box, className: 'space-y-3 p-4' })}>
      {/* Header */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <AlertCircle size={16} className={cfg.icon} />
          <p className={`text-sm font-bold ${cfg.title}`}>
            {isPending && 'ลูกค้าแนบสลิปการโอนเงิน — รอตรวจสอบ'}
            {isApproved && 'สลิปได้รับการยืนยันแล้ว'}
            {isRejected && 'สลิปถูกปฏิเสธ'}
            {isWaiting && 'รอลูกค้าแนบสลิปการโอนเงิน'}
          </p>
        </div>
        <FactoryStatusBadge tone={cfg.tone}>{cfg.label}</FactoryStatusBadge>
      </div>

      {/* Slip image */}
      {slipData.slip_url ? (
        <button
          type='button'
          onClick={() => setPreviewUrl(String(slipData.slip_url))}
          className='block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-none transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple'
        >
          <img
            src={String(slipData.slip_url)}
            alt='สลิปการโอนเงิน'
            className='max-h-52 object-contain'
          />
        </button>
      ) : null}

      {/* Slip note */}
      {slipData.slip_note ? (
        <p
          className={factoryBadgeClass({
            variant: isRejected ? 'danger' : isApproved ? 'verified' : 'warning',
            className: 'w-fit max-w-full rounded-lg px-3 py-1.5 text-left font-medium',
          })}
        >
          หมายเหตุจากลูกค้า: {String(slipData.slip_note)}
        </p>
      ) : null}

      {/* Verification info (for AP/RJ) */}
      {(isApproved || isRejected) && slipData.verified_at ? (
        <div className='flex items-center gap-3 text-[11px] text-slate-500'>
          <span>ตรวจสอบเมื่อ {formatDateTime(String(slipData.verified_at))}</span>
        </div>
      ) : null}

      {/* Upload time */}
      {slipData.uploaded_at ? (
        <p className='text-[11px] text-slate-400'>
          อัปโหลดเมื่อ {formatDateTime(String(slipData.uploaded_at))}
        </p>
      ) : null}

      {/* Action buttons — only for ST (pending) */}
      {isPending ? (
        !showRejectInput ? (
          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              disabled={acting}
              onClick={handleApprove}
              className={factoryButtonClass({
                variant: 'success',
                size: 'md',
                className: 'flex-1',
              })}
            >
              {acting ? 'กำลังดำเนินการ…' : 'ยืนยันรับเงิน'}
            </Button>
            <Button
              variant='unstyled'
              type='button'
              disabled={acting}
              onClick={() => setShowRejectInput(true)}
              className={factoryButtonClass({ variant: 'dangerOutline', size: 'md' })}
            >
              ปฏิเสธ
            </Button>
          </div>
        ) : (
          <div className='space-y-2'>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='ระบุเหตุผลในการปฏิเสธ (อย่างน้อย 5 ตัวอักษร)'
              className={factoryInputClass({
                className:
                  'min-h-[76px] resize-none border-red-200 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200',
              })}
              rows={2}
            />
            <div className='flex items-center gap-2'>
              <Button
                variant='unstyled'
                type='button'
                disabled={acting || rejectReason.trim().length < 5}
                onClick={handleReject}
                className={factoryButtonClass({
                  variant: 'danger',
                  size: 'md',
                  className: 'flex-1',
                })}
              >
                {acting ? 'กำลังดำเนินการ…' : 'ยืนยันปฏิเสธสลิป'}
              </Button>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                }}
                className={factoryButtonClass({ variant: 'toolbar', size: 'md' })}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        )
      ) : null}

      {/* Fullscreen preview modal */}
      {previewUrl ? (
        <div
          className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4'
          onClick={() => setPreviewUrl(null)}
        >
          <div className='relative max-h-[90vh] max-w-5xl' onClick={(e) => e.stopPropagation()}>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setPreviewUrl(null)}
              className='absolute -right-3 -top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/15 text-white shadow-none hover:bg-white/25'
              aria-label='ปิดตัวอย่างสลิป'
            >
              <X size={20} />
            </Button>
            <img
              src={previewUrl}
              alt='สลิปเต็ม'
              className='max-h-[85vh] max-w-full rounded-lg object-contain'
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Payment Transactions Table ── */

function txTypeLabel(type: string): string {
  const t = type?.toUpperCase();
  if (t === 'DEPOSIT') return 'มัดจำ';
  if (t === 'FULL' || t === 'FULL_PAYMENT') return 'ชำระเต็ม';
  if (t === 'REFUND') return 'คืนเงิน';
  if (t === 'COMMISSION') return 'ค่าบริการ';
  if (t === 'TRANSFER') return 'โอนเงิน';
  return type || '-';
}

function txStatusBadge(status: string) {
  const s = status?.toUpperCase();
  if (s === 'SUCCESS' || s === 'CP' || s === 'AP')
    return <FactoryStatusBadge tone='success'>สำเร็จ</FactoryStatusBadge>;
  if (s === 'PENDING' || s === 'PE' || s === 'ST')
    return <FactoryStatusBadge tone='warning'>รอดำเนินการ</FactoryStatusBadge>;
  if (s === 'FAILED' || s === 'RJ' || s === 'CN')
    return <FactoryStatusBadge tone='danger'>ล้มเหลว</FactoryStatusBadge>;
  return <FactoryStatusBadge tone='neutral'>{status || '-'}</FactoryStatusBadge>;
}

function PaymentTransactionsTable({ orderId }: { orderId: string | number }) {
  const [txs, setTxs] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ordersApi.listPayments(orderId);
        if (!cancelled) setTxs(Array.isArray(res) ? res : []);
      } catch {
        if (!cancelled) setTxs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className='rounded-md border border-slate-200 bg-white p-4'>
        <div className='h-5 w-40 bg-slate-100 rounded animate-pulse mb-3' />
        <div className='space-y-2'>
          {[1, 2].map((i) => (
            <div key={i} className='h-10 bg-[var(--brand-page)] rounded animate-pulse' />
          ))}
        </div>
      </div>
    );
  }

  if (txs.length === 0) return null;

  return (
    <div className='rounded-md border border-slate-200 bg-white overflow-hidden'>
      <div className='px-4 py-3 border-b border-slate-100 flex items-center gap-2'>
        <Handshake size={14} className='text-brand-purple' />
        <h2 className='text-sm font-bold text-slate-900'>ประวัติการชำระเงิน</h2>
        <FactoryStatusBadge tone='neutral'>{txs.length} รายการ</FactoryStatusBadge>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-[var(--brand-page)] text-[11px] font-semibold text-slate-500 uppercase tracking-wide'>
              <th className='px-4 py-2.5 text-left'>วันที่</th>
              <th className='px-4 py-2.5 text-left'>ประเภท</th>
              <th className='px-4 py-2.5 text-right'>จำนวนเงิน</th>
              <th className='px-4 py-2.5 text-left'>วิธีชำระ</th>
              <th className='px-4 py-2.5 text-center'>สถานะ</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {txs.map((tx, i) => {
              const txId = String(tx.payment_id ?? tx.tx_id ?? tx.id ?? i);
              return (
                <tr key={txId} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--brand-page)]/40'}>
                  <td className='px-4 py-2.5 text-[12px] text-slate-600 whitespace-nowrap'>
                    {formatDateTime(String(tx.created_at ?? tx.paid_at ?? '-'))}
                  </td>
                  <td className='px-4 py-2.5 text-[12px] font-medium text-slate-700'>
                    {txTypeLabel(String(tx.type ?? tx.payment_type ?? ''))}
                  </td>
                  <td className='px-4 py-2.5 text-[13px] font-bold text-slate-900 text-right tabular-nums'>
                    {formatCurrency(Number(tx.amount ?? tx.total ?? 0))}
                  </td>
                  <td className='px-4 py-2.5 text-[12px] text-slate-600'>
                    {String(tx.payment_method ?? tx.method ?? 'โอนเงิน')}
                  </td>
                  <td className='px-4 py-2.5 text-center'>
                    {txStatusBadge(String(tx.status ?? ''))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
