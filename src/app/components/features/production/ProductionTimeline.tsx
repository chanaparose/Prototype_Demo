import React, { useEffect, useMemo, useState } from 'react';
import type { MergedProductionStep } from '@/components/features/production/types';
import { StepRow } from '@/components/features/production/StepRow';
import { deriveStepStates } from '@/components/features/production/stepDerivedState';

type Props = {
  merged: MergedProductionStep[];
  orderStatus?: string;
  isFactory: boolean;
  isCustomer: boolean;
  onOpenDrawer: (m: MergedProductionStep) => void;
  onOpenReject: (m: MergedProductionStep) => void;
  onContactFactory?: () => void;
  onPhotoClick: (url: string) => void;
};

function defaultOpenKeys(
  merged: MergedProductionStep[],
  derived: ReturnType<typeof deriveStepStates>,
): Set<string> {
  const keys = new Set<string>();
  merged.forEach((m, i) => {
    const state = derived[i];
    if (state === 'active' || state === 'blocked' || state === 'rejected') {
      keys.add(m.template.step_code || String(m.template.step_id));
    }
  });
  return keys;
}

export function ProductionTimeline({
  merged,
  orderStatus,
  isFactory,
  isCustomer,
  onOpenDrawer,
  onOpenReject,
  onContactFactory,
  onPhotoClick,
}: Props) {
  const [openCodes, setOpenCodes] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const derivedStates = useMemo(() => deriveStepStates(merged, orderStatus), [merged, orderStatus]);

  useEffect(() => {
    if (!merged.length) return;
    if (initialized) return;
    setOpenCodes(defaultOpenKeys(merged, derivedStates));
    setInitialized(true);
  }, [merged, derivedStates, initialized]);

  useEffect(() => {
    if (!initialized) return;
    setOpenCodes((prev) => {
      const defaults = defaultOpenKeys(merged, derivedStates);
      if (prev.size === 0 && defaults.size > 0) return defaults;
      return prev;
    });
  }, [merged, derivedStates, initialized]);

  return (
    <div className='rounded-xl border border-slate-200/80 bg-white p-4' aria-label='ไทม์ไลน์การผลิต'>
      <p className='mb-4 text-sm font-bold text-brand-navy-ink'>ความคืบหน้าการผลิต</p>
      <div>
        {merged.map((m, i) => {
          const key = m.template.step_code || String(m.template.step_id);
          const expanded = openCodes.has(key);
          const uid = m.update.update_id;
          const canReject =
            m.update.status === 'CD' &&
            uid != null &&
            Number.isFinite(Number(uid)) &&
            Number(uid) > 0;
          return (
            <StepRow
              key={key}
              merged={m}
              derivedState={derivedStates[i]}
              expanded={expanded}
              isLast={i === merged.length - 1}
              onToggleExpand={() =>
                setOpenCodes((prev) => {
                  const next = new Set(prev);
                  if (expanded) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              isFactory={isFactory}
              isCustomer={isCustomer}
              canReject={canReject}
              onOpenDrawer={() => onOpenDrawer(m)}
              onContactFactory={onContactFactory}
              onPhotoClick={onPhotoClick}
            />
          );
        })}
      </div>
    </div>
  );
}
