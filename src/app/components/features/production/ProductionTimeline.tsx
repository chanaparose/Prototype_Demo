import React, { useState } from 'react';
import type { MergedProductionStep } from './types';
import { StepRow } from './StepRow';

type Props = {
  merged: MergedProductionStep[];
  isFactory: boolean;
  isCustomer: boolean;
  onOpenDrawer: (m: MergedProductionStep) => void;
  onOpenReject: (m: MergedProductionStep) => void;
  onPhotoClick: (url: string) => void;
};

export function ProductionTimeline({
  merged,
  isFactory,
  isCustomer,
  onOpenDrawer,
  onOpenReject,
  onPhotoClick,
}: Props) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  return (
    <div className="space-y-3" aria-label="ไทม์ไลน์การผลิต">
      {merged.map((m) => {
        const key = m.template.step_code || String(m.template.step_id);
        const expanded = openCode === key;
        const uid = m.update.update_id;
        const canReject =
          m.update.status === 'CD' && uid != null && Number.isFinite(Number(uid)) && Number(uid) > 0;
        return (
          <StepRow
            key={key}
            merged={m}
            expanded={expanded}
            onToggleExpand={() => setOpenCode(expanded ? null : key)}
            isFactory={isFactory}
            isCustomer={isCustomer}
            canReject={canReject}
            onOpenDrawer={() => onOpenDrawer(m)}
            onOpenReject={() => onOpenReject(m)}
            onPhotoClick={onPhotoClick}
          />
        );
      })}
    </div>
  );
}
