import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import type { MergedProductionStep } from '@/components/features/production/types';
import {
  STEP_VISUAL,
  type StepDerivedState,
} from '@/components/features/production/stepDerivedState';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { formatDateTime } from '@/utils/formatting/formatDate';

type Props = {
  merged: MergedProductionStep;
  derivedState: StepDerivedState;
  expanded: boolean;
  isLast: boolean;
  onToggleExpand: () => void;
  isFactory: boolean;
  isCustomer: boolean;
  canReject: boolean;
  onOpenDrawer: () => void;
  onContactFactory?: () => void;
  onPhotoClick: (url: string) => void;
};

function renderRailDot(state: StepDerivedState) {
  switch (state) {
    case 'completed':
      return (
        <span className='relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500'>
          <CheckCircle2 size={12} className='text-white' aria-hidden />
        </span>
      );
    case 'active':
      return (
        <span className='relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple ring-4 ring-brand-purple/20'>
          <span className='h-2 w-2 rounded-full bg-white' />
        </span>
      );
    case 'blocked':
      return (
        <span className='relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400'>
          <AlertCircle size={12} className='text-white' aria-hidden />
        </span>
      );
    case 'rejected':
      return (
        <span className='relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500'>
          <XCircle size={12} className='text-white' aria-hidden />
        </span>
      );
    case 'upcoming':
    default:
      return (
        <span className='relative z-10 h-3 w-3 rounded-full border-2 border-slate-200 bg-white' />
      );
  }
}

function shortTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day}/${month}\n${hh}:${mm}`;
}

export function StepRow({
  merged,
  derivedState,
  expanded,
  isLast,
  onToggleExpand,
  isFactory,
  isCustomer,
  canReject,
  onOpenDrawer,
  onContactFactory,
  onPhotoClick,
}: Props) {
  const { template, update } = merged;
  const stepId = Number(template.step_id ?? 0);
  const factoryCanUpdateThisStep = Number.isFinite(stepId) && stepId > 0 && stepId <= 4;
  const st = update.status;
  const visual = STEP_VISUAL[derivedState];
  const isActive = derivedState === 'active';
  const isCompleted = derivedState === 'completed';

  const ctaFactory = !factoryCanUpdateThisStep ? null : st === 'IP' ? (
    <Button
      variant='unstyled'
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onOpenDrawer();
      }}
      className='shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white'
      style={{ background: 'var(--brand-violet)' }}
    >
      อัปเดตขั้นนี้
    </Button>
  ) : st === 'CD' ? (
    <Button
      variant='unstyled'
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onOpenDrawer();
      }}
      className='shrink-0 rounded-xl border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-800'
    >
      แก้ไข
    </Button>
  ) : st === 'RJ' ? (
    <Button
      variant='unstyled'
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onOpenDrawer();
      }}
      className='shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white'
      style={{ background: 'var(--brand-purple)' }}
    >
      ส่งใหม่
    </Button>
  ) : isFactory && isActive ? (
    <Button
      variant='unstyled'
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onOpenDrawer();
      }}
      className='shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white'
      style={{ background: 'var(--brand-purple)' }}
    >
      เริ่มขั้นต่อไป
    </Button>
  ) : null;

  const timestamp = update.last_updated_at;
  const titleClass =
    isActive || derivedState === 'blocked' || derivedState === 'rejected'
      ? 'text-sm font-bold text-brand-navy-ink'
      : isCompleted
        ? 'text-sm font-medium text-slate-500'
        : 'text-sm font-medium text-slate-400';

  const canExpand = derivedState !== 'upcoming';

  return (
    <div
      className='flex gap-2'
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={derivedState === 'upcoming' ? true : undefined}
    >
      <div className='w-11 shrink-0 pt-0.5 text-right'>
        <p className='whitespace-pre-line text-[10px] leading-tight text-slate-400'>
          {shortTimestamp(timestamp)}
        </p>
      </div>

      <div className='flex w-5 shrink-0 flex-col items-center'>
        {renderRailDot(derivedState)}
        {!isLast ? (
          <div
            className={`mt-1 w-0.5 flex-1 min-h-[24px] ${
              isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
            }`}
          />
        ) : null}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? 'pb-1' : 'pb-5'}`}>
        <div
          role={canExpand ? 'button' : undefined}
          tabIndex={canExpand ? 0 : undefined}
          className={`text-left ${canExpand ? 'cursor-pointer' : ''}`}
          onClick={canExpand ? onToggleExpand : undefined}
          onKeyDown={
            canExpand
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleExpand();
                  }
                }
              : undefined
          }
        >
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-1.5'>
                <p className={titleClass}>{template.step_name_th}</p>
                {visual.chipLabel ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${visual.chipClass}`}
                  >
                    {visual.chipLabel}
                  </span>
                ) : null}
                <span className='sr-only'>{visual.ariaLabel}</span>
              </div>
              {!expanded && template.description ? (
                <p
                  className={`mt-0.5 line-clamp-1 text-[11px] ${
                    isActive ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {template.description}
                </p>
              ) : null}
            </div>
            {isFactory ? (
              <div className='shrink-0' onClick={(e) => e.stopPropagation()}>
                {ctaFactory}
              </div>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className='mt-2 space-y-2.5 text-sm'>
            {template.description ? (
              <p className='text-xs leading-relaxed text-slate-600'>{template.description}</p>
            ) : null}
            {update.description ? (
              <div>
                <p className='text-[10px] font-medium uppercase tracking-wide text-slate-400'>
                  หมายเหตุ
                </p>
                <p className='whitespace-pre-wrap text-xs text-slate-700'>{update.description}</p>
              </div>
            ) : null}
            {update.rejected_reason && st === 'RJ' ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900'>
                <strong>เหตุผลปฏิเสธ:</strong> {update.rejected_reason}
              </div>
            ) : null}
            {update.image_urls && update.image_urls.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {update.image_urls.map((u) => (
                  <Button
                    variant='unstyled'
                    key={u}
                    type='button'
                    className='h-14 w-14 overflow-hidden rounded-lg border border-slate-200'
                    onClick={() => onPhotoClick(u)}
                  >
                    <Image src={u} alt='' className='h-full w-full object-cover' />
                  </Button>
                ))}
              </div>
            ) : null}
            {isCustomer && canReject && onContactFactory ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={onContactFactory}
                className='inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800'
              >
                <MessageCircle size={14} aria-hidden />
                แชทกับโรงงาน
              </Button>
            ) : null}
            {isCustomer && derivedState === 'blocked' && onContactFactory ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={onContactFactory}
                className='inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800'
              >
                <MessageCircle size={14} aria-hidden />
                แชทกับโรงงาน
              </Button>
            ) : null}
            {timestamp ? (
              <p className='text-[11px] text-slate-400'>อัปเดต {formatDateTime(timestamp)}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
