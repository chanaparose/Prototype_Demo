import React, { useEffect, useMemo, useState } from 'react';
import type { MergedProductionStep } from './types';
import { StepRow } from './StepRow';
import { deriveStepStates } from './stepDerivedState';

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

  const derivedStates = useMemo(
    () => deriveStepStates(merged, orderStatus),
    [merged, orderStatus],
  );

  useEffect(() => {
    if (!merged.length) return;
    setOpenCodes((prev) => {
      if (prev.size > 0) return prev;
      return new Set(merged.map((m) => m.template.step_code || String(m.template.step_id)));
    });
  }, [merged]);

  return (
    <div className="space-y-3" aria-label="ไทม์ไลน์การผลิต">
      {merged.map((m, i) => {
        const key = m.template.step_code || String(m.template.step_id);
        const expanded = openCodes.has(key);
        const uid = m.update.update_id;
        const canReject =
          m.update.status === 'CD' && uid != null && Number.isFinite(Number(uid)) && Number(uid) > 0;
        return (
          <StepRow
            key={key}
            merged={m}
            derivedState={derivedStates[i]}
            expanded={expanded}
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
            onOpenReject={() => onOpenReject(m)}
            onContactFactory={onContactFactory}
            onPhotoClick={onPhotoClick}
          />
        );
      })}
    </div>
  );
}
