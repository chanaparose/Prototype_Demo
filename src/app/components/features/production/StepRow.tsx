import React from 'react';
import { Lock, CheckCircle2, XCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import type { MergedProductionStep } from './types';
import { STEP_VISUAL, type StepDerivedState } from './stepDerivedState';

type Props = {
  merged: MergedProductionStep;
  derivedState: StepDerivedState;
  expanded: boolean;
  onToggleExpand: () => void;
  isFactory: boolean;
  isCustomer: boolean;
  canReject: boolean;
  onOpenDrawer: () => void;
  onOpenReject: () => void;
  onPhotoClick: (url: string) => void;
};

function renderStateIcon(state: StepDerivedState) {
  switch (state) {
    case 'completed':
      return <CheckCircle2 size={20} className="text-emerald-600" aria-hidden />;
    case 'active':
      return (
        <span className="relative inline-flex items-center justify-center" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-violet-300/40 motion-safe:animate-ping" />
          <Loader2
            size={20}
            className="text-[#A238FF] motion-safe:animate-spin"
            style={{ animationDuration: '1.6s' }}
          />
        </span>
      );
    case 'blocked':
      return <AlertCircle size={20} className="text-amber-500" aria-hidden />;
    case 'rejected':
      return <XCircle size={20} className="text-red-500" aria-hidden />;
    case 'upcoming':
    default:
      return <Lock size={18} className="text-gray-300" aria-hidden />;
  }
}

function rowShell(state: StepDerivedState): string {
  switch (state) {
    case 'active':
      return 'bg-[#F5ECFF] border-[#A238FF] shadow-sm';
    case 'blocked':
      return 'bg-amber-50 border-amber-200';
    case 'rejected':
      return 'bg-red-50 border-red-200';
    case 'completed':
    case 'upcoming':
    default:
      return 'bg-white border-gray-100';
  }
}

function titleClass(state: StepDerivedState): string {
  if (state === 'active') return 'text-sm text-gray-900 font-bold';
  if (state === 'upcoming') return 'text-sm text-gray-400 font-semibold';
  return 'text-sm text-gray-700 font-semibold';
}

function descClass(state: StepDerivedState): string {
  if (state === 'active') return 'text-[11px] text-gray-600 mt-0.5 line-clamp-1';
  if (state === 'upcoming') return 'text-[11px] text-gray-400 mt-0.5 line-clamp-1';
  return 'text-[11px] text-gray-500 mt-0.5 line-clamp-1';
}

export function StepRow({
  merged,
  derivedState,
  expanded,
  onToggleExpand,
  isFactory,
  isCustomer,
  canReject,
  onOpenDrawer,
  onOpenReject,
  onPhotoClick,
}: Props) {
  const { template, update } = merged;
  const st = update.status;
  const visual = STEP_VISUAL[derivedState];
  const isActive = derivedState === 'active';
  const isBlocked = derivedState === 'blocked';

  const ctaFactory =
    st === 'IP' ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDrawer();
        }}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: '#7C3AED' }}
      >
        อัปเดตขั้นนี้
      </button>
    ) : st === 'CD' ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDrawer();
        }}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-200 text-violet-800"
      >
        แก้ไข
      </button>
    ) : st === 'RJ' ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDrawer();
        }}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: '#A238FF' }}
      >
        ส่งใหม่
      </button>
    ) : isFactory && isActive ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDrawer();
        }}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: '#A238FF' }}
      >
        เริ่มขั้นนี้
      </button>
    ) : null;

  const ctaCustomer =
    st === 'CD' && canReject ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenReject();
        }}
        className="shrink-0 text-xs font-semibold text-violet-700 underline"
      >
        ขอตรวจสอบใหม่
      </button>
    ) : null;

  const showPayChip =
    template.is_payment_trigger &&
    (derivedState === 'upcoming' || derivedState === 'active' || derivedState === 'blocked');

  return (
    <div
      className={`rounded-2xl border ${rowShell(derivedState)} overflow-hidden transition-colors`}
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={derivedState === 'upcoming' ? true : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer"
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <div className="mt-0.5 shrink-0">{renderStateIcon(derivedState)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`${titleClass(derivedState)} truncate`}>{template.step_name_th}</p>
            {visual.chipLabel ? (
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${visual.chipClass}`}
              >
                {visual.chipLabel}
              </span>
            ) : null}
            <span className="sr-only">{visual.ariaLabel}</span>
          </div>
          {template.description ? (
            <p className={descClass(derivedState)}>{template.description}</p>
          ) : null}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
          {isFactory ? ctaFactory : null}
          {isCustomer ? ctaCustomer : null}
        </div>
      </div>

      {showPayChip ? (
        <div className="px-4 pb-2 -mt-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-100 text-violet-900">
            <Sparkles size={12} aria-hidden />
            ขั้นนี้จะทริกเกอร์ชำระเงินงวดถัดไป
          </span>
        </div>
      ) : null}

      {isBlocked ? (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[11px] text-amber-800">
            รอลูกค้าดำเนินการก่อนจึงจะเริ่มขั้นตอนนี้ได้
          </p>
        </div>
      ) : null}

      {expanded ? (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100/80 space-y-3 text-sm">
          {update.description ? (
            <div>
              <p className="text-[10px] text-gray-500 uppercase">หมายเหตุ</p>
              <p className="text-gray-800 whitespace-pre-wrap">{update.description}</p>
            </div>
          ) : null}
          {update.rejected_reason && st === 'RJ' ? (
            <div className="rounded-xl bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-900">
              <strong>เหตุผลปฏิเสธ:</strong> {update.rejected_reason}
            </div>
          ) : null}
          {update.image_urls && update.image_urls.length > 0 ? (
            <div>
              <p className="text-[10px] text-gray-500 uppercase mb-1">รูปภาพ</p>
              <div className="flex flex-wrap gap-2">
                {update.image_urls.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                    onClick={() => onPhotoClick(u)}
                  >
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {update.last_updated_at ? (
            <p className="text-[11px] text-gray-400">
              อัปเดตล่าสุด{' '}
              {new Date(update.last_updated_at).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
