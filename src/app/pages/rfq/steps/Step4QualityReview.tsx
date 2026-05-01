import React from 'react';
import { CertificationChips } from '../../../shared/ui/CertificationChips';
import type { RFQDraft } from '../useRFQDraft';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

const CERTS = ['ISO 9001', 'FDA', 'RoHS', 'GMP', 'CE', 'HACCP'];

export function Step4QualityReview({ draft, setDraft }: Props) {
  return (
    <div className="space-y-4">
      <CertificationChips
        options={CERTS}
        value={draft.certifications_required}
        onChange={(v) => setDraft({ certifications_required: v })}
      />

      <div className="flex items-center gap-2">
        <input
          id="sampleRequired"
          type="checkbox"
          checked={draft.sample_required}
          onChange={(e) => setDraft({ sample_required: e.target.checked })}
        />
        <label htmlFor="sampleRequired" className="text-sm text-gray-700">
          ต้องการตัวอย่างสินค้า
        </label>
      </div>

      {draft.sample_required ? (
        <input
          type="number"
          min={1}
          value={draft.sample_qty ?? ''}
          onChange={(e) => setDraft({ sample_qty: Number(e.target.value) || undefined })}
          placeholder="จำนวนตัวอย่าง"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
      ) : null}

      <select
        value={draft.inspection_type ?? ''}
        onChange={(e) =>
          setDraft({
            inspection_type: (e.target.value || undefined) as
              | 'self'
              | 'third_party'
              | 'buyer_onsite'
              | undefined,
          })
        }
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="">รูปแบบตรวจคุณภาพ</option>
        <option value="self">ตรวจสอบโดยโรงงาน</option>
        <option value="third_party">ตรวจสอบโดยหน่วยงานภายนอก</option>
        <option value="buyer_onsite">ผู้ซื้อเข้าตรวจที่โรงงาน</option>
      </select>

      
    </div>
  );
}
