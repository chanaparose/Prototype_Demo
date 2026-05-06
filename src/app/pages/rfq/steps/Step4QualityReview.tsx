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

      {/* "ต้องการตัวอย่างสินค้า" ตัดออกจาก section นี้แล้ว
          → ใช้ tab "ขอซื้อตัวอย่าง" (request_kind=PS/MS) แทน */}

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
