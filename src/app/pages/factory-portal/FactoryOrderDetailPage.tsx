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
    <div className="w-full max-w-7xl mx-auto pb-24">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/factory/orders')}
          className="w-10 h-10 rounded-xl border border-[#2A3158] flex items-center justify-center bg-[#1F2340] text-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] text-white/50">Factory Order</p>
          <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 mb-4">
          {error}
        </p>
      ) : null}

      {loading && !order.status ? (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#6D5EF8', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 lg:gap-5 items-start">

          {/* ════════ LEFT ════════ */}
          <div className="space-y-4 min-w-0">

            {/* Order summary */}
            <section className="rounded-2xl bg-[#1F2340] border border-[#2A3158] p-4 text-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-white/60">Order</p>
                  <p className="text-base font-semibold truncate">#{orderCode}</p>
                  <p className="text-[12px] text-white/70 mt-1">{statusLabel(status)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#6D5EF8]/30 text-[#CBC5FF]">
                  {status || '-'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 text-xs">
                <InfoCell
                  label="มูลค่ารวม"
                  value={`฿${Number(order.total_amount ?? 0).toLocaleString('th-TH')}`}
                />
                <InfoCell
                  label="ชำระแล้ว"
                  value={`฿${Number(order.total_amount ?? order.deposit_amount ?? 0).toLocaleString('th-TH')}`}
                />
                <InfoCell label="สร้างเมื่อ" value={fmtDateTime(order.created_at)} />
                <InfoCell label="กำหนดส่ง" value={fmtDateTime(order.estimated_delivery)} />
              </div>
            </section>

            {/* RFQ + Quotation spec */}
            {rfq ? (
              <RfqReferenceCard
                rfq={rfq}
                quotation={quotation}
                variant="accordion"
                defaultOpen={false}
              />
            ) : null}

            {/* Production Timeline */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-0.5">
                <Flag size={14} className="text-[#6D5EF8]" />
                <h2 className="text-sm font-bold text-white">ความคืบหน้าการผลิต</h2>
              </div>

              {tplQ.isLoading || updQ.isLoading ? (
                <div className="flex items-center gap-2 py-6 justify-center text-white/60 text-sm">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-[#6D5EF8]" />
                  กำลังโหลด…
                </div>
              ) : merged.length === 0 ? (
                <p className="text-sm text-white/50 px-1">ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>
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
          </div>

          {/* ════════ RIGHT ════════ */}
          <aside className="space-y-4 xl:sticky xl:top-4">

            {/* ── Next action card ── */}
            <section className="rounded-2xl bg-[#1F2340] border border-[#2A3158] p-4 text-white">
              <h2 className="font-semibold mb-3">การดำเนินการ</h2>

              {isCompleted ? (
                <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 px-3 py-3 text-sm text-emerald-300 text-center">
                  ✓ ออเดอร์นี้เสร็จสิ้นแล้ว
                </div>
              ) : activeStep == null && totalSteps > 0 ? (
                <div className="rounded-xl bg-[#252B4D] border border-[#303965] px-3 py-3 text-sm text-white/60 text-center">
                  ทุกขั้นตอนเสร็จสิ้นแล้ว
                </div>
              ) : activeStep != null ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-[#252B4D] border border-[#303965] px-3 py-3">
                    <p className="text-[10px] text-white/50 uppercase tracking-wide mb-1">
                      ขั้นตอนถัดไป ({nextStepIdx + 1}/{totalSteps})
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {activeStep.template.step_name_th}
                    </p>
                    {activeStep.template.description ? (
                      <p className="text-xs text-white/60 mt-0.5">
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
                      className="w-full rounded-xl py-3 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #6D5EF8 0%, #4C46D3 100%)' }}
                    >
                      {activeStep.update.status === 'IP'
                        ? 'อัปเดตขั้นนี้'
                        : activeStep.update.status === 'RJ'
                          ? 'ส่งใหม่'
                          : 'เริ่มขั้นต่อไป'}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-[#252B4D] border border-[#303965] px-3 py-3 text-xs text-white/70">
                      ขั้นที่ 6 เป็นขั้นปิดงานฝั่งลูกค้า/ระบบอัตโนมัติ โรงงานไม่ต้องอัปเดตเอง
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/50">กำลังโหลดขั้นตอน…</p>
              )}
            </section>
          </aside>
        </div>
      )}

      {/* ── Step Update Drawer ── */}
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

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#303965] bg-[#252B4D] px-3 py-2">
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="text-sm font-semibold mt-0.5 text-white truncate">{value}</p>
    </div>
  );
}

type StepState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

function StepStatusBadge({ state }: { state: StepState }) {
  const map: Record<StepState, { label: string; cls: string }> = {
    completed: { label: 'เสร็จสิ้น', cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' },
    active:    { label: 'กำลังดำเนินการ', cls: 'bg-[#6D5EF8]/20 text-[#CBC5FF] border-[#6D5EF8]/40' },
    blocked:   { label: 'รอดำเนินการ', cls: 'bg-amber-900/30 text-amber-400 border-amber-700/40' },
    rejected:  { label: 'ต้องแก้ไข', cls: 'bg-red-900/30 text-red-400 border-red-700/40' },
    upcoming:  { label: 'ยังไม่เริ่ม', cls: 'bg-[#2A3158] text-white/50 border-[#3A4475]' },
  };
  const { label, cls } = map[state];
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}
