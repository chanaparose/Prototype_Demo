import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, Flag, MapPin, Phone, User,
  CheckCircle2, Circle, AlertCircle, Clock, Package,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { QuoteNestedDTO, RfqNestedDTO } from '../../types/api';
import { useAuth } from '../../stores';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { ordersApi } from '../../services/api';
import { RfqReferenceCard } from '../../components/features/order-detail';
import { useProductionTemplate } from '../../hooks/production/useProductionTemplate';
import { useOrderProductionUpdates } from '../../hooks/production/useOrderProductionUpdates';
import { ProductionHeader } from '../../components/features/production/ProductionHeader';
import { ProductionTimeline } from '../../components/features/production/ProductionTimeline';
import { UpdateStepDrawer, type CustomerShippingInfo } from '../../components/features/production/UpdateStepDrawer';
import {
  mergeTemplateWithUpdates,
  type MergedProductionStep,
} from '../../components/features/production/types';
import { deriveStepStates } from '../../components/features/production/stepDerivedState';
import { getStepGuide } from '../../components/features/production/stepGuideConfig';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { FactoryPageHeader } from './components/FactoryPageHeader';

function unwrapOrder(raw: Record<string, unknown>): Record<string, unknown> {
  return (raw.order as Record<string, unknown>) ?? raw;
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

function statusColor(code: string): { bg: string; text: string; border: string } {
  const s = code.toUpperCase();
  if (s === 'CP') return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  if (s === 'CN' || s === 'PE') return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (s === 'SH') return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (s === 'QC' || s === 'PR') return { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' };
  return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
}

function getStepId(step: MergedProductionStep | null): number {
  if (!step) return 0;
  return Number.isFinite(Number(step.template.step_id ?? 0)) ? Number(step.template.step_id) : 0;
}

function factoryCanUpdateStep(step: MergedProductionStep | null): boolean {
  const n = getStepId(step);
  return n > 0 && n <= 5;
}

function fmtDateTime(input: unknown): string {
  const raw = String(input ?? '');
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(input: unknown): string {
  const raw = String(input ?? '');
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' });
}

/** ดึงข้อมูลที่อยู่จัดส่งจาก order/rfq object */
function extractShippingInfo(order: Record<string, unknown>): CustomerShippingInfo {
  // ลอง path หลาย ๆ แบบที่ API อาจส่งมา
  const addr =
    (order.delivery_address as Record<string, unknown>) ??
    (order.shipping_address as Record<string, unknown>) ??
    ((order.rfq as Record<string, unknown>)?.address as Record<string, unknown>) ??
    {};

  const buyer =
    (order.buyer as Record<string, unknown>) ??
    (order.customer as Record<string, unknown>) ??
    {};

  return {
    recipientName:
      String(addr.recipient_name ?? addr.name ?? buyer.name ?? order.buyer_name ?? '').trim() || undefined,
    phone:
      String(addr.phone ?? addr.tel ?? buyer.phone ?? order.buyer_phone ?? '').trim() || undefined,
    addressLine:
      String(addr.address_detail ?? addr.address_line ?? addr.detail ?? '').trim() || undefined,
    subDistrict:
      String(addr.sub_district ?? addr.subdistrict ?? '').trim() || undefined,
    district:
      String(addr.district ?? '').trim() || undefined,
    province:
      String(addr.province ?? '').trim() || undefined,
    postalCode:
      String(addr.postal_code ?? addr.zip_code ?? '').trim() || undefined,
  };
}

/* ─────────────────────────────────────────── */
/*  Next Action Card (Shopee-seller style)     */
/* ─────────────────────────────────────────── */
type StepState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

function StepStatusBadge({ state }: { state: StepState }) {
  const map: Record<StepState, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
    completed: { label: 'เสร็จสิ้น',        bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', icon: <CheckCircle2 size={12} /> },
    active:    { label: 'กำลังดำเนินการ',   bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE', icon: <Clock size={12} /> },
    blocked:   { label: 'รอดำเนินการ',      bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', icon: <AlertCircle size={12} /> },
    rejected:  { label: 'ต้องแก้ไข',        bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', icon: <AlertCircle size={12} /> },
    upcoming:  { label: 'ยังไม่เริ่ม',      bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', icon: <Circle size={12} /> },
  };
  const { label, bg, color, border, icon } = map[state];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      {icon}{label}
    </span>
  );
}

interface NextActionCardProps {
  step: MergedProductionStep;
  stepIndex: number;
  totalSteps: number;
  state: StepState;
  customerShipping: CustomerShippingInfo;
  onUpdate: () => void;
}

function NextActionCard({ step, stepIndex, totalSteps, state, customerShipping, onUpdate }: NextActionCardProps) {
  const guide = getStepGuide(getStepId(step));
  const canUpdate = factoryCanUpdateStep(step);
  const stepId = getStepId(step);
  const isShipping = stepId === 5;
  const isQC = Boolean(step.template.is_payment_trigger);

  const hasAddr = customerShipping.addressLine || customerShipping.phone || customerShipping.recipientName;

  return (
    <section className="rounded-2xl overflow-hidden border border-indigo-200 shadow-md">

      {/* Header bar */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{guide.emoji}</span>
          <div>
            <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wide">
              ขั้นตอนที่ {stepIndex + 1} / {totalSteps}
            </p>
            <p className="text-sm font-bold text-white leading-tight">{step.template.step_name_th}</p>
          </div>
        </div>
        <StepStatusBadge state={state} />
      </div>

      <div className="bg-white p-4 space-y-3">

        {/* What to do */}
        <div>
          <p className="text-xs font-bold text-slate-800">{guide.whatToDo}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{guide.guidance}</p>
        </div>

        {/* Payment trigger warning */}
        {isQC ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
            <span className="text-base leading-none shrink-0 mt-0.5">💳</span>
            <p className="text-xs text-amber-800">
              <strong>การยืนยันขั้นนี้จะส่งคำขอชำระเงินส่วนที่เหลือให้ลูกค้าทันที</strong>
            </p>
          </div>
        ) : null}

        {/* Shipping address preview — step 5 */}
        {isShipping && hasAddr ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MapPin size={11} /> ที่อยู่จัดส่ง — สำหรับทำใบปะหน้าพัสดุ
            </p>
            <div className="space-y-1">
              {customerShipping.recipientName ? (
                <div className="flex items-center gap-1.5">
                  <User size={11} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-900">{customerShipping.recipientName}</span>
                </div>
              ) : null}
              {customerShipping.phone ? (
                <div className="flex items-center gap-1.5">
                  <Phone size={11} className="text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800">{customerShipping.phone}</span>
                </div>
              ) : null}
              {customerShipping.addressLine ? (
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-800 leading-relaxed">
                    {[customerShipping.addressLine, customerShipping.subDistrict, customerShipping.district, customerShipping.province, customerShipping.postalCode].filter(Boolean).join(', ')}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Bullet preview (first 3 items) — dot list เหมือน UpdateStepDrawer */}
        <ul className="space-y-1.5">
          {guide.bulletPoints.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>

        {/* What happens after */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center gap-2">
          <span className="text-sm">➡️</span>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">เมื่อยืนยัน:</span> {guide.nextStepHint}
          </p>
        </div>

        {/* CTA Button */}
        {canUpdate ? (
          <button
            type="button"
            onClick={onUpdate}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
          >
            <Package size={16} />
            {step.update.status === 'IP'
              ? 'อัปเดตและยืนยันขั้นนี้'
              : step.update.status === 'RJ'
                ? 'ส่งหลักฐานใหม่'
                : guide.confirmLabel}
          </button>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-center">
            <p className="text-xs text-emerald-700 font-medium">
              ⏳ {step.template.description ?? 'รอการยืนยันจากลูกค้าหรือระบบอัตโนมัติ'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Main Page                                  */
/* ─────────────────────────────────────────── */
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

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const detail = await ordersApi.get(id);
      setOrder(unwrapOrder(detail as Record<string, unknown>));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดออเดอร์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const tplQ = useProductionTemplate();
  const updQ = useOrderProductionUpdates(id);

  const merged = useMemo<MergedProductionStep[]>(() => {
    if (!tplQ.data?.length || !updQ.data) return [];
    return mergeTemplateWithUpdates(tplQ.data, updQ.data.updates);
  }, [tplQ.data, updQ.data]);

  const displayMerged = useMemo<MergedProductionStep[]>(
    () =>
      merged.map((m) => {
        const stepId = Number(m.template.step_id ?? 0);
        if (stepId === 5) return { ...m, template: { ...m.template, step_name_th: 'บรรจุและจัดส่งสินค้า', description: 'ทำใบปะหน้าพัสดุ บรรจุสินค้า และบันทึกหลักฐานการจัดส่ง' } };
        if (stepId === 6) return { ...m, template: { ...m.template, step_name_th: 'รอลูกค้ายืนยันรับสินค้า', description: 'ลูกค้ายืนยันรับสินค้า หรือระบบปิดอัตโนมัติหลัง 20 วัน' } };
        return m;
      }),
    [merged],
  );

  const orderStatus = updQ.data?.order_status ?? String(order.status ?? '').toUpperCase();
  const derivedStates = useMemo(() => deriveStepStates(displayMerged, orderStatus), [displayMerged, orderStatus]);

  const activeStepIdx = useMemo(
    () => derivedStates.findIndex((d) => d === 'active' || d === 'blocked'),
    [derivedStates],
  );
  const nextStepIdx = useMemo(() => {
    if (activeStepIdx >= 0) return activeStepIdx;
    return derivedStates.findIndex((d) => d === 'upcoming');
  }, [activeStepIdx, derivedStates]);

  const activeStep = nextStepIdx >= 0 ? displayMerged[nextStepIdx] ?? null : null;
  const activeState = (nextStepIdx >= 0 ? derivedStates[nextStepIdx] : null) as StepState | null;

  const [drawerStep, setDrawerStep] = useState<MergedProductionStep | null>(null);

  const handleStepSubmit = useCallback(
    async (
      body: { step_id: number; status: 'IP' | 'CD'; description?: string; image_urls: string[]; confirm_payment_trigger?: boolean },
      opts?: { confirmPaymentTriggerHeader?: boolean },
    ) => {
      if (!id) return;
      if (Number(body.step_id) > 5) throw new Error('ขั้นที่ 6 เป็นขั้นยืนยันรับสินค้าฝั่งลูกค้า/ระบบอัตโนมัติ');
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

  const rfq = order.rfq && typeof order.rfq === 'object' ? (order.rfq as RfqNestedDTO) : null;
  const quotation = order.quotation && typeof order.quotation === 'object' ? (order.quotation as QuoteNestedDTO) : null;
  const title = String(rfq?.title ?? order.rfq_title ?? order.title ?? order.project_name ?? `คำสั่งซื้อ #${id ?? ''}`);
  const orderCode = String(order.order_no ?? order.order_id ?? id ?? '-');
  const status = String(order.status ?? '').toUpperCase();
  const isCompleted = status === 'CP' || status === 'CN';
  const totalSteps = displayMerged.length;
  const sc = statusColor(status);

  const customerShipping = useMemo(() => extractShippingInfo(order), [order]);
  const completedCount = derivedStates.filter((s) => s === 'completed').length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (!id) return null;

  return (
    <div className="space-y-4 pb-24">
      <FactoryPageHeader
        title={title}
        subtitle={`คำสั่งซื้อ #${orderCode}`}
        icon={Flag}
        count={statusLabel(status)}
      />

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-y border-slate-200 px-4 h-14 flex items-center gap-3 rounded-xl">
        <button
          type="button"
          onClick={() => navigate('/factory/orders')}
          className="flex items-center gap-1 text-sm font-medium text-indigo-700"
        >
          <ChevronLeft size={18} /> กลับ
        </button>
        <span className="flex-1 text-center text-sm font-bold text-slate-900 truncate">รายละเอียดคำสั่งซื้อ</span>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
          style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
        >
          {statusLabel(status)}
        </span>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        ) : null}

        {loading && !order.status ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_550px] gap-4 lg:gap-5 items-start">

            {/* ════════ LEFT ════════ */}
            <div className="space-y-4 min-w-0">

              {/* Order Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">#{orderCode}</p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                  >
                    {statusLabel(status)}
                  </span>
                </div>

                {/* Progress bar */}
                {totalSteps > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>ความคืบหน้า</span>
                      <span className="font-semibold text-indigo-700">{progressPct}% ({completedCount}/{totalSteps} ขั้นตอน)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">มูลค่ารวม</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      ฿{Number(order.total_amount ?? 0).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">ชำระแล้ว</p>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">
                      ฿{Number(order.total_amount ?? order.deposit_amount ?? 0).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">กำหนดส่ง</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{fmtDate(order.estimated_delivery)}</p>
                  </div>
                </div>
              </div>

              {/* Order detail rows */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">ข้อมูลคำสั่งซื้อ</p>
                {[
                  { label: 'สร้างเมื่อ', value: fmtDateTime(order.created_at) },
                  { label: 'กำหนดส่ง', value: fmtDateTime(order.estimated_delivery) },
                  { label: 'มูลค่ารวม', value: `฿${Number(order.total_amount ?? 0).toLocaleString('th-TH')}` },
                  { label: 'ชำระแล้ว', value: `฿${Number(order.total_amount ?? order.deposit_amount ?? 0).toLocaleString('th-TH')}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>{value}</span>
                  </div>
                ))}
              </section>

              {/* RFQ + Quotation spec */}
              {rfq ? (
                <RfqReferenceCard rfq={rfq} quotation={quotation} variant="accordion" />
              ) : null}
            </div>

            {/* ════════ RIGHT ════════ */}
            <aside className="space-y-4 xl:sticky xl:top-20">

              {/* Next Action Card */}
              {isCompleted ? (
                <section className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-1">
                  <p className="text-2xl">🎉</p>
                  <p className="text-sm font-bold text-emerald-800">ออเดอร์นี้เสร็จสิ้นแล้ว</p>
                  <p className="text-xs text-emerald-600">ขอบคุณที่ดำเนินการเสร็จสิ้น</p>
                </section>
              ) : activeStep != null && totalSteps > 0 ? (
                <NextActionCard
                  step={activeStep}
                  stepIndex={nextStepIdx}
                  totalSteps={totalSteps}
                  state={activeState ?? 'upcoming'}
                  customerShipping={customerShipping}
                  onUpdate={() => {
                    if (factoryCanUpdateStep(activeStep)) setDrawerStep(activeStep);
                  }}
                />
              ) : totalSteps > 0 ? (
                <section className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-center">
                  <p className="text-sm text-gray-500">ทุกขั้นตอนเสร็จสิ้น — รอลูกค้ายืนยัน</p>
                </section>
              ) : (
                <section className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-center">
                  <p className="text-sm text-gray-400">กำลังโหลดขั้นตอน…</p>
                </section>
              )}

              {/* Production Timeline */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Flag size={14} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">ความคืบหน้าการผลิต</h2>
                </div>

                {tplQ.isLoading || updQ.isLoading ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-gray-500 text-sm">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
                    กำลังโหลด…
                  </div>
                ) : merged.length === 0 ? (
                  <p className="text-sm text-gray-400 px-1">ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>
                ) : (
                  <>
                    <ProductionHeader merged={displayMerged} orderStatus={orderStatus} />
                    <ProductionTimeline
                      merged={displayMerged}
                      orderStatus={orderStatus}
                      isFactory={!isCompleted}
                      isCustomer={false}
                      onOpenDrawer={(m) => {
                        if (!isCompleted && factoryCanUpdateStep(m)) setDrawerStep(m);
                      }}
                      onOpenReject={() => { /* factory ไม่ reject ตัวเอง */ }}
                      onPhotoClick={() => { /* TODO: lightbox */ }}
                    />
                  </>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>

      {/* Step Update Drawer */}
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
