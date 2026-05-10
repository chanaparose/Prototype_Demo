import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Flag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { QuoteNestedDTO, RfqNestedDTO } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { ordersApi } from '../../services/api';
import { RfqReferenceCard } from '../../components/features/order-detail';
import { useProductionTemplate } from '../../hooks/production/useProductionTemplate';
import { useOrderProductionUpdates } from '../../hooks/production/useOrderProductionUpdates';
import { ProductionHeader } from '../../components/features/production/ProductionHeader';
import { ProductionTimeline } from '../../components/features/production/ProductionTimeline';
import { UpdateStepDrawer } from '../../components/features/production/UpdateStepDrawer';
import {
  mergeTemplateWithUpdates,
  type MergedProductionStep,
} from '../../components/features/production/types';
import { deriveStepStates } from '../../components/features/production/stepDerivedState';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { FactoryPageHeader } from './components/FactoryPageHeader';

function unwrapOrder(raw: Record<string, unknown>): Record<string, unknown> {
  return (raw.order as Record<string, unknown>) ?? raw;
}

function statusLabel(code: string): string {
  const s = code.toUpperCase();
  if (s === 'PP') return 'รอชำระเงิน';
  if (s === 'PE') return 'หมดกำหนดชำระ';
  if (s === 'PD') return 'ชำระแล้ว รอเริ่มผลิต';
  if (s === 'PR') return 'กำลังผลิต';
  if (s === 'QC') return 'ตรวจคุณภาพ';
  if (s === 'SH') return 'จัดส่งแล้ว';
  if (s === 'CP') return 'เสร็จสิ้น';
  if (s === 'CN') return 'ยกเลิก';
  return s || '-';
}

function getStepId(step: MergedProductionStep | null): number {
  if (!step) return 0;
  const n = Number(step.template.step_id ?? 0);
  return Number.isFinite(n) ? n : 0;
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

export function FactoryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const qc = useQueryClient();
  const drawerWide = useIsDesktop(768);

  // suppress unused warning
  void fid;

  /* ── Order header data ── */
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

  /* ── Production data via React Query ── */
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
        if (stepId === 5) {
          return {
            ...m,
            template: {
              ...m.template,
              step_name_th: 'จัดส่งแล้ว',
              description: 'บันทึกหลักฐานการจัดส่งสินค้า',
            },
          };
        }
        if (stepId === 6) {
          return {
            ...m,
            template: {
              ...m.template,
              step_name_th: 'ออเดอร์นี้เสร็จสิ้นแล้ว',
              description: 'รอลูกค้ายืนยันรับสินค้า หรือครบ 20 วันระบบจะปิดออเดอร์อัตโนมัติ',
            },
          };
        }
        return m;
      }),
    [merged],
  );

  const orderStatus = updQ.data?.order_status ?? String(order.status ?? '').toUpperCase();

  const derivedStates = useMemo(
    () => deriveStepStates(displayMerged, orderStatus),
    [displayMerged, orderStatus],
  );

  /* ── Active / next step for sidebar ── */
  const activeStepIdx = useMemo(
    () => derivedStates.findIndex((d) => d === 'active' || d === 'blocked'),
    [derivedStates],
  );
  const nextStepIdx = useMemo(() => {
    if (activeStepIdx >= 0) return activeStepIdx;
    // all done or no IP — find first PD
    return derivedStates.findIndex((d) => d === 'upcoming');
  }, [activeStepIdx, derivedStates]);

  const activeStep = nextStepIdx >= 0 ? displayMerged[nextStepIdx] ?? null : null;
  const activeState = nextStepIdx >= 0 ? derivedStates[nextStepIdx] : null;

  /* ── Drawer state ── */
  const [drawerStep, setDrawerStep] = useState<MergedProductionStep | null>(null);

  const handleStepSubmit = useCallback(
    async (
      body: {
        step_id: number;
        status: 'IP' | 'CD';
        description?: string;
        image_urls: string[];
        confirm_payment_trigger?: boolean;
      },
      opts?: { confirmPaymentTriggerHeader?: boolean },
    ) => {
      if (!id) return;
      if (Number(body.step_id) > 5) {
        throw new Error('ขั้นที่ 6 เป็นขั้นยืนยันรับสินค้าฝั่งลูกค้า/ระบบอัตโนมัติ');
      }
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

  /* ── Derived ── */
  const rfq = order.rfq && typeof order.rfq === 'object' ? (order.rfq as RfqNestedDTO) : null;
  const quotation =
    order.quotation && typeof order.quotation === 'object'
      ? (order.quotation as QuoteNestedDTO)
      : null;
  const title = String(
    rfq?.title ?? order.rfq_title ?? order.title ?? order.project_name ?? `คำสั่งซื้อ #${id ?? ''}`,
  );
  const orderCode = String(order.order_no ?? order.order_id ?? id ?? '-');
  const status = String(order.status ?? '').toUpperCase();
  const isCompleted = status === 'CP' || status === 'CN';
  const totalSteps = displayMerged.length;

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
        <span className="flex-1 text-center text-sm font-bold text-slate-900">
          รายละเอียดคำสั่งซื้อ
        </span>
        <span className="text-xs font-medium text-gray-400">#{orderCode}</span>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        ) : null}

        {loading && !order.status ? (
          <div className="flex justify-center py-16">
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 lg:gap-5 items-start">

            {/* ════════ LEFT ════════ */}
            <div className="space-y-4 min-w-0">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {statusLabel(status)}
                  </span>
                  <span className="text-xs text-slate-400">#{orderCode}</span>
                </div>
                <h2 className="text-base font-bold mb-3 text-slate-900">{title}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">มูลค่ารวม</p>
                    <p className="font-semibold text-slate-900">฿{Number(order.total_amount ?? 0).toLocaleString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">ชำระแล้ว</p>
                    <p className="font-semibold text-slate-900">฿{Number(order.total_amount ?? order.deposit_amount ?? 0).toLocaleString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">กำหนดส่ง</p>
                    <p className="font-semibold text-slate-900">{fmtDateTime(order.estimated_delivery)}</p>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">ข้อมูลคำสั่งซื้อ</p>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-500">สร้างเมื่อ</span>
                  <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>{fmtDateTime(order.created_at)}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-500">กำหนดส่ง</span>
                  <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>{fmtDateTime(order.estimated_delivery)}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-500">มูลค่ารวม</span>
                  <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                    ฿{Number(order.total_amount ?? 0).toLocaleString('th-TH')}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-500">ชำระแล้ว</span>
                  <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                    ฿{Number(order.total_amount ?? order.deposit_amount ?? 0).toLocaleString('th-TH')}
                  </span>
                </div>
              </section>

              {/* RFQ + Quotation spec */}
              {rfq ? (
                <RfqReferenceCard
                  rfq={rfq}
                  quotation={quotation}
                  variant="accordion"
                />
              ) : null}
            </div>

            {/* ════════ RIGHT ════════ */}
            <aside className="space-y-4 xl:sticky xl:top-20">

              {/* Next action card */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">การดำเนินการ</p>

                {isCompleted ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-800 text-center">
                    ออเดอร์นี้เสร็จสิ้นแล้ว
                  </div>
                ) : activeStep == null && totalSteps > 0 ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-3 text-sm text-gray-500 text-center">
                    ทุกขั้นตอนเสร็จสิ้นแล้ว
                  </div>
                ) : activeStep != null ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        ขั้นตอนถัดไป ({nextStepIdx + 1}/{totalSteps})
                      </p>
                      <p className="text-sm font-semibold" style={{ color: '#2E2252' }}>
                        {activeStep.template.step_name_th}
                      </p>
                      {activeStep.template.description ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activeStep.template.description}
                        </p>
                      ) : null}
                      <div className="mt-2">
                        <StepStatusBadge state={activeState ?? 'upcoming'} />
                      </div>
                    </div>

                    {factoryCanUpdateStep(activeStep) ? (
                      <button
                        type="button"
                        onClick={() => setDrawerStep(activeStep)}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-sm"
                        style={{ background: '#4F46E5' }}
                      >
                        {activeStep.update.status === 'IP'
                          ? 'อัปเดตขั้นนี้'
                          : activeStep.update.status === 'RJ'
                            ? 'ส่งใหม่'
                            : 'เริ่มขั้นต่อไป'}
                      </button>
                    ) : (
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-3 text-xs text-gray-500">
                        ขั้นที่ 6 เป็นขั้นปิดงานฝั่งลูกค้า/ระบบอัตโนมัติ โรงงานไม่ต้องอัปเดตเอง
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">กำลังโหลดขั้นตอน…</p>
                )}
              </section>

              {/* Production Timeline */}
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 px-0.5">
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
                      onOpenReject={() => {/* factory ไม่ reject ตัวเอง */}}
                      onPhotoClick={() => {/* TODO: lightbox */}}
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
      />
    </div>
  );
}

/* ── Sub-components ── */

type StepState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

function StepStatusBadge({ state }: { state: StepState }) {
  const map: Record<StepState, { label: string; bg: string; color: string; border: string }> = {
    completed: { label: 'เสร็จสิ้น', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
    active:    { label: 'กำลังดำเนินการ', bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
    blocked:   { label: 'รอดำเนินการ', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    rejected:  { label: 'ต้องแก้ไข', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    upcoming:  { label: 'ยังไม่เริ่ม', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  };
  const { label, bg, color, border } = map[state];
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      {label}
    </span>
  );
}
