import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Input } from '@/components/ui/input';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

export function Step2Specifications({ draft, setDraft }: Props) {
  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal placeholder:font-normal data-[placeholder]:font-normal focus:border-brand-violet-deep focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.10)]';

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
