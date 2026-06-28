import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { MergedProductionStep } from '@/components/features/production/types';
import {
  deriveStepStates,
  type StepDerivedState,
} from '@/components/features/production/stepDerivedState';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

function formatRelativeTh(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'เมื่อสักครู่';
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const day = Math.floor(h / 24);
  return `${day} วันที่แล้ว`;
}

function segmentDone(state: StepDerivedState): boolean {
  return state === 'completed';
}

function stepDotClass(state: StepDerivedState): string {
  switch (state) {
    case 'active':
      return 'h-3.5 w-3.5 bg-brand-purple ring-4 ring-brand-purple/15';
    case 'blocked':
      return 'h-3 w-3 bg-amber-400 ring-2 ring-amber-100';
    case 'rejected':
      return 'h-3 w-3 bg-red-400 ring-2 ring-red-100';
    case 'completed':
      return 'h-2.5 w-2.5 bg-brand-violet-deep/75';
    case 'upcoming':
    default:
      return 'h-2.5 w-2.5 border-2 border-slate-200 bg-white';
  }
}

function stepLabelClass(state: StepDerivedState): string {
  switch (state) {
    case 'active':
      return 'font-semibold text-brand-purple';
    case 'blocked':
      return 'font-medium text-amber-700';
    case 'rejected':
      return 'font-medium text-red-600';
    case 'completed':
      return 'font-medium text-brand-violet-deep/75';
    case 'upcoming':
    default:
      return 'font-normal text-slate-400';
  }
}

type Props = {
  orderId: string;
  projectName: string;
  statusLabelTh?: string;
  merged: MergedProductionStep[];
  orderStatus?: string;
  factoryId: string;
  factoryName: string;
  factoryImage?: string;
  onChat: () => void;
};

export function OrderDetailStatusHero({
  orderId,
  projectName,
  statusLabelTh,
  merged,
  orderStatus,
  factoryId,
  factoryName,
  factoryImage,
  onChat,
}: Props) {
  const navigate = useNavigate();
  const derived = useMemo(() => deriveStepStates(merged, orderStatus), [merged, orderStatus]);

  const lastIso = useMemo(() => {
    let best = '';
    for (const m of merged) {
      const t = m.update.last_updated_at;
      if (!t) continue;
      if (!best || new Date(t) > new Date(best)) best = t;
    }
    return best;
  }, [merged]);

  const badgeLabel = statusLabelTh?.trim() || 'กำลังดำเนินการ';

  return (
    <div className='space-y-3 rounded-xl border border-brand-purple/10 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-sm'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-semibold leading-tight text-brand-navy-ink'>
            <span className='text-brand-violet-deep/70'>คำสั่งซื้อ</span>
            <span className='mx-1 font-normal text-slate-300'>·</span>
            <span>OD-{orderId}</span>
          </p>
          <p className='mt-0.5 truncate text-sm font-bold text-brand-navy-ink'>{projectName}</p>
        </div>
        <span className='shrink-0 rounded-full bg-brand-purple/10 px-2.5 py-1 text-[10px] font-semibold text-brand-violet-deep'>
          {badgeLabel}
        </span>
      </div>

      <div className='flex items-center gap-2.5 border-t border-brand-purple/8 pt-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(`/factories/${factoryId}`)}
          className='flex min-w-0 flex-1 items-center gap-2.5 text-left'
        >
          {factoryImage ? (
            <Image
              src={factoryImage}
              alt=''
              className='h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-brand-purple/10'
            />
          ) : (
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/8 text-sm font-bold text-brand-violet-deep'>
              {factoryName.charAt(0)}
            </div>
          )}
          <div className='min-w-0'>
            <p className='text-[10px] font-medium text-slate-400'>โรงงานผู้ผลิต</p>
            <p className='truncate text-sm font-semibold text-brand-navy-ink'>{factoryName}</p>
          </div>
        </Button>
        <Button
          variant='unstyled'
          type='button'
          onClick={onChat}
          className='inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-purple/15 bg-brand-purple/5 px-2.5 py-2 text-xs font-semibold text-brand-violet-deep'
        >
          <MessageCircle size={14} aria-hidden />
          แชท
        </Button>
      </div>

      {merged.length > 0 ? (
        <div className='border-t border-brand-purple/8 pt-3' aria-label='ความคืบหน้าการผลิต'>
          <div className='flex w-full'>
            {merged.map((m, i) => {
              const state = derived[i];
              const isFirst = i === 0;
              const isLast = i === merged.length - 1;
              const label = m.template.step_name_th;
              const leftDone = i > 0 && segmentDone(derived[i - 1]);
              const rightDone = !isLast && segmentDone(state);

              return (
                <div
                  key={m.template.step_code || String(m.template.step_id)}
                  className='flex min-w-0 flex-1 flex-col items-center'
                >
                  <div className='relative flex h-7 w-full items-center justify-center'>
                    {!isFirst ? (
                      <span
                        className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${
                          leftDone ? 'bg-brand-purple/35' : 'bg-slate-200'
                        }`}
                        aria-hidden
                      />
                    ) : null}
                    {!isLast ? (
                      <span
                        className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${
                          rightDone ? 'bg-brand-purple/35' : 'bg-slate-200'
                        }`}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`relative z-10 shrink-0 rounded-full transition-all ${stepDotClass(state)}`}
                      title={label}
                    />
                  </div>
                  <p
                    className={`mt-1.5 w-full px-0.5 text-center text-[9px] leading-tight line-clamp-2 ${stepLabelClass(state)}`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {lastIso ? (
        <p className='border-t border-brand-purple/8 pt-2 text-xs text-slate-500'>
          อัปเดตล่าสุด {formatRelativeTh(lastIso)}
        </p>
      ) : null}
    </div>
  );
}
