import React, { useRef, useState } from 'react';
import { mediaApi } from '../../../services/api';
import { DimensionInput } from '../../../shared/ui/DimensionInput';
import type { RFQDraft } from '../useRFQDraft';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
};

export function Step2Specifications({ draft, setDraft }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="text-xs font-semibold text-violet-600"
      >
        {advanced ? 'Basic' : 'Advanced'}
      </button>
      <input
        value={draft.material_grade}
        onChange={(e) => setDraft({ material_grade: e.target.value })}
        placeholder="Material grade"
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      {advanced ? (
        <>
          <input
            value={draft.tolerance}
            onChange={(e) => setDraft({ tolerance: e.target.value })}
            placeholder="Tolerance"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={draft.color_finish}
            onChange={(e) => setDraft({ color_finish: e.target.value })}
            placeholder="Color / Finish"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <DimensionInput value={draft.dimension_spec} onChange={(v) => setDraft({ dimension_spec: v })} />
          <input
            value={draft.packaging_spec}
            onChange={(e) => setDraft({ packaging_spec: e.target.value })}
            placeholder="Packaging spec"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </>
      ) : null}

      <div className="space-y-2">
        <input
          ref={ref}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadOne(f);
            if (ref.current) ref.current.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading || draft.reference_images.length >= 5}
          className="rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm w-full"
        >
          {uploading
            ? 'กำลังอัปโหลด...'
            : draft.reference_images.length >= 5
              ? 'อัปโหลดครบ 5 ไฟล์แล้ว'
              : 'อัปโหลดไฟล์อ้างอิง (สูงสุด 5 ไฟล์)'}
        </button>
        {draft.reference_images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {draft.reference_images.map((u, idx) => (
              <span key={u + idx} className="text-[11px] px-2 py-1 rounded bg-gray-100">
                ไฟล์ {idx + 1}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
