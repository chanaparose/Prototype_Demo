import React from 'react';
import { Lock, CheckCircle2, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import type { MergedProductionStep } from './types';

type Props = {
  merged: MergedProductionStep;
  expanded: boolean;
  onToggleExpand: () => void;
  isFactory: boolean;
  isCustomer: boolean;
  canReject: boolean;
  onOpenDrawer: () => void;
  onOpenReject: () => void;
  onPhotoClick: (url: string) => void;
};

export function StepRow({
  merged,
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

  const statusIcon = (() => {
    if (st === 'PD') return <Lock size={18} className="text-gray-400" aria-hidden />;
    if (st === 'IP')
      return (
        <Loader2
          size={18}
          className="text-amber-500 animate-spin"
          style={{ animationDuration: '2.2s' }}
          aria-label="กำลังดำเนินการ"
        />
      );
    if (st === 'CD') return <CheckCircle2 size={18} className="text-emerald-600" aria-hidden />;
    return <AlertTriangle size={18} className="text-red-500" aria-hidden />;
  })();

  const rowBg =
    st === 'IP' ? 'bg-amber-50/60 border-amber-100' : st === 'RJ' ? 'bg-red-50/40 border-red-100' : 'bg-white border-gray-100';

  const showPayChip = template.is_payment_trigger;

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

  return (
    <div className={`rounded-2xl border ${rowBg} overflow-hidden`}>
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
        <div className="mt-0.5 shrink-0" aria-hidden>
          {statusIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{template.step_name_th}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
          {isFactory ? ctaFactory : null}
          {isCustomer ? ctaCustomer : null}
        </div>
      </div>

      {showPayChip && (st === 'IP' || st === 'PD') ? (
        <div className="px-4 pb-2 -mt-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-100 text-violet-900">
            <Sparkles size={12} aria-hidden />
            ขั้นนี้จะทริกเกอร์ชำระเงินงวดถัดไป
          </span>
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
