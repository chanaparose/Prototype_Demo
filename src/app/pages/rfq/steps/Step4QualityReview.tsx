import React from 'react';
import { CertificationChips } from '@/shared/ui/CertificationChips';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

const CERTS = ['ISO 9001', 'FDA', 'RoHS', 'GMP', 'CE', 'HACCP'];

export function Step4QualityReview({ draft, setDraft }: Props) {
  return (
    <div className='space-y-4'>
      <CertificationChips
        options={CERTS}
        value={draft.certifications_required}
        onChange={(v) => setDraft({ certifications_required: v })}
      />
    </div>
  );
}
