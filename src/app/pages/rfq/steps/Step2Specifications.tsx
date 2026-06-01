import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Input } from '@/components/ui/input';
import { RFQ_FIELD_CLASS } from '@/pages/rfq/rfqCreateWizardUi';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

export function Step2Specifications({ draft, setDraft }: Props) {
  const fieldClass = RFQ_FIELD_CLASS;

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
    </div>
  );
}
