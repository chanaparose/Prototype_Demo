import React, { useState } from 'react';
import { DimensionInput } from '@/shared/ui/DimensionInput';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

export function Step2Specifications({ draft, setDraft }: Props) {
  const [advanced, setAdvanced] = useState(false);

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-[var(--neutral-warm-surface)]/50 px-3 py-2.5 text-sm focus:border-brand-violet-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.12)]';

  return (
    <div className='space-y-3'>
      <label className='block'>
        <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>เกรด / วัตถุดิบ</span>
      <Input
        value={draft.material_grade}
        onChange={(e) => setDraft({ material_grade: e.target.value })}
        placeholder='เช่น PP, สแตนเลส 304'
        className={fieldClass}
      />
      </label>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setAdvanced((v) => !v)}
        className='text-[11px] font-semibold text-brand-violet-deep'
      >
        {advanced ? 'ซ่อนสเปกขั้นสูง' : '+ สเปกขั้นสูง (ขนาด สี บรรจุภัณฑ์)'}
      </Button>
      {advanced ? (
        <>
          <Input
            value={draft.tolerance}
            onChange={(e) => setDraft({ tolerance: e.target.value })}
            placeholder='ความคลาดเคลื่อน (Tolerance)'
            className={fieldClass}
          />
          <Input
            value={draft.color_finish}
            onChange={(e) => setDraft({ color_finish: e.target.value })}
            placeholder='สี / ผิวสำเร็จ'
            className={fieldClass}
          />
          <DimensionInput
            value={draft.dimension_spec}
            onChange={(v) => setDraft({ dimension_spec: v })}
          />
          <Input
            value={draft.packaging_spec}
            onChange={(e) => setDraft({ packaging_spec: e.target.value })}
            placeholder='บรรจุภัณฑ์'
            className={fieldClass}
          />
        </>
      ) : null}
    </div>
  );
}
