import React from 'react';
import { Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { MergedProductionStep } from '@/components/features/production/types';
import {
  STEP_VISUAL,
  type StepDerivedState,
} from '@/components/features/production/stepDerivedState';
import { Button } from '@/components/ui/button';

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
  onContactFactory?: () => void;
  onPhotoClick: (url: string) => void;
};

function renderStateIcon(state: StepDerivedState) {
  switch (state) {
    case 'completed':
      return <CheckCircle2 size={20} className='text-emerald-600' aria-hidden />;
    case 'active':
      return (
        <span
          className='inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#A238FF] bg-[#A238FF]/10'
          aria-label='กำลังดำเนินการ'
          role='img'
        >
          <span className='h-2 w-2 rounded-full bg-[#A238FF]' />
        </span>
      );
    case 'blocked':
      return <AlertCircle size={20} className='text-amber-500' aria-hidden />;
    case 'rejected':
      return <XCircle size={20} className='text-red-500' aria-hidden />;
    case 'upcoming':
    default:
      return <Lock size={18} className='text-gray-300' aria-hidden />;
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
  onContactFactory,
  onPhotoClick,
}: Props) {
  const { template, update } = merged;
  const stepId = Number(template.step_id ?? 0);
  // Business rule: step 6 is customer/system completion (confirm receive / auto-close),
  // so factory should not manually update it from FE.
  const factoryCanUpdateThisStep = Number.isFinite(stepId) && stepId > 0 && stepId <= 5;
  const st = update.status;
  const visual = STEP_VISUAL[derivedState];
  const isActive = derivedState === 'active';
  const isBlocked = derivedState === 'blocked';

  const ctaFactory = !factoryCanUpdateThisStep ? null : st === 'IP' ? (
    <Button
      variant='unstyled'
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onOpenDrawer();
      }}
      className='shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white'
      style={{ background: '#7C3AED' }}
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
      className='shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-200 text-violet-800'
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
      className='shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white'
      style={{ background: '#A238FF' }}
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
      className='shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white'
      style={{ background: '#A238FF' }}
    >
      เริ่มขั้นต่อไป
    </Button>
  ) : null;

  const ctaCustomer =
    st === 'CD' && canReject ? (
      <Button
        variant='unstyled'
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onContactFactory?.();
        }}
        className='shrink-0 text-xs font-semibold text-violet-700 underline'
      >
        ติดต่อโรงงาน
      </Button>
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
        role='button'
        tabIndex={0}
        className='w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer'
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <div className='mt-0.5 shrink-0'>{renderStateIcon(derivedState)}</div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <p className={`${titleClass(derivedState)} truncate`}>{template.step_name_th}</p>
            {visual.chipLabel ? (
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${visual.chipClass}`}
              >
                {visual.chipLabel}
              </span>
            ) : null}
            <span className='sr-only'>{visual.ariaLabel}</span>
          </div>
          {template.description ? (
            <p className={descClass(derivedState)}>{template.description}</p>
          ) : null}
        </div>
        <div
          className='shrink-0 flex flex-col items-end gap-1'
          onClick={(e) => e.stopPropagation()}
        >
          {isFactory ? ctaFactory : null}
          {isCustomer ? ctaCustomer : null}
        </div>
      </div>

      {isBlocked ? (
        <div className='px-4 pb-3 -mt-1'>
          <p className='text-[11px] text-amber-800'>รอลูกค้าดำเนินการก่อนจึงจะเริ่มขั้นตอนนี้ได้</p>
        </div>
      ) : null}

      {expanded ? (
        <div className='px-4 pb-4 pt-0 border-t border-gray-100/80 space-y-3 text-sm'>
          {update.description ? (
            <div>
              <p className='text-[10px] text-gray-500 uppercase'>หมายเหตุ</p>
              <p className='text-gray-800 whitespace-pre-wrap'>{update.description}</p>
            </div>
          ) : null}
          {update.rejected_reason && st === 'RJ' ? (
            <div className='rounded-xl bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-900'>
              <strong>เหตุผลปฏิเสธ:</strong> {update.rejected_reason}
            </div>
          ) : null}
          {update.image_urls && update.image_urls.length > 0 ? (
            <div>
              <p className='text-[10px] text-gray-500 uppercase mb-1'>รูปภาพ</p>
              <div className='flex flex-wrap gap-2'>
                {update.image_urls.map((u) => (
                  <Button
                    variant='unstyled'
                    key={u}
                    type='button'
                    className='w-16 h-16 rounded-lg overflow-hidden border border-gray-200'
                    onClick={() => onPhotoClick(u)}
                  >
                    <img src={u} alt='' className='w-full h-full object-cover' />
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {update.last_updated_at ? (
            <p className='text-[11px] text-gray-400'>
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
