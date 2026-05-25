import React, { useRef, useState } from 'react';
import { mediaApi } from '@/services/api/factoryApi';
import { DimensionInput } from '@/shared/ui/DimensionInput';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

export function Step2Specifications({ draft, setDraft }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const ref = useRef<HTMLInputElement>(null);

  const uploadOne = async (f: File) => {
    if (draft.reference_images.length >= 5) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(f);
      setDraft({ reference_images: [...draft.reference_images, res.url].slice(0, 5) });
    } finally {
      setUploading(false);
    }
  };

  const removeReference = (index: number) => {
    setDraft({ reference_images: draft.reference_images.filter((_, i) => i !== index) });
  };

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

      <div className='space-y-2'>
        <p className='text-[11px] font-semibold text-brand-navy-deep'>รูป / เอกสารอ้างอิง</p>
        <Input
          ref={ref}
          type='file'
          accept='image/*,.pdf'
          className='hidden'
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadOne(f);
            if (ref.current) ref.current.value = '';
          }}
        />
        <Button
          variant='unstyled'
          type='button'
          onClick={() => ref.current?.click()}
          disabled={uploading || draft.reference_images.length >= 5}
          className='rounded-xl border border-dashed border-brand-mauve-light/60 bg-brand-lavender-chip/50 px-3 py-3 text-[12px] font-medium text-brand-violet-deep w-full'
        >
          {uploading
            ? 'กำลังอัปโหลด...'
            : draft.reference_images.length >= 5
              ? 'ครบ 5 ไฟล์แล้ว'
              : `เพิ่มไฟล์ (${draft.reference_images.length}/5)`}
        </Button>
        {draft.reference_images.length > 0 ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
            {draft.reference_images.map((u, idx) => (
              <div
                key={u + idx}
                className='relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-100'
              >
                {!brokenImages[idx] ? (
                  <Image
                    src={u}
                    alt={`reference-${idx + 1}`}
                    className='w-full h-full object-cover'
                    onError={() => setBrokenImages((prev) => ({ ...prev, [idx]: true }))}
                  />
                ) : (
                  <div className='w-full h-full px-2 flex items-center justify-center text-[11px] text-gray-600 text-center'>
                    เอกสารอ้างอิง #{idx + 1}
                  </div>
                )}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => removeReference(idx)}
                  className='absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs leading-none'
                  aria-label={`ลบไฟล์อ้างอิง ${idx + 1}`}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
