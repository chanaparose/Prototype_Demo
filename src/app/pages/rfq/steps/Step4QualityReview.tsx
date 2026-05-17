import React from 'react';
import { CertificationChips } from '@/shared/ui/CertificationChips';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

      {/* "ต้องการตัวอย่างสินค้า" ตัดออกจาก section นี้แล้ว
          → ใช้ tab "ขอซื้อตัวอย่าง" (request_kind=PS/MS) แทน */}

      <Select
        value={draft.inspection_type ?? ''}
        onValueChange={(next) =>
          setDraft({
            inspection_type: (next === '__empty' ? undefined : next) as
              | 'self'
              | 'third_party'
              | 'buyer_onsite'
              | undefined,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder='รูปแบบตรวจคุณภาพ' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='__empty'>รูปแบบตรวจคุณภาพ</SelectItem>
          <SelectItem value='self'>ตรวจสอบโดยโรงงาน</SelectItem>
          <SelectItem value='third_party'>ตรวจสอบโดยหน่วยงานภายนอก</SelectItem>
          <SelectItem value='buyer_onsite'>ผู้ซื้อเข้าตรวจที่โรงงาน</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
