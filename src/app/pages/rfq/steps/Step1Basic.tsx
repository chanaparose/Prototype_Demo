import React from 'react';
import type { RFQDraft } from '../useRFQDraft';

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
  categories: { id: number; name: string }[];
  units: { id: number; name: string }[];
};

export function Step1Basic({ draft, setDraft, categories, units }: Props) {
  return (
    <div className="space-y-3">
      <input
        value={draft.title}
        onChange={(e) => setDraft({ title: e.target.value })}
        placeholder="ชื่อโปรเจกต์ *"
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <textarea
        value={draft.description}
        onChange={(e) => setDraft({ description: e.target.value })}
        placeholder="รายละเอียดงาน *"
        rows={4}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-2">
        <select
          value={draft.category_id ?? ''}
          onChange={(e) => setDraft({ category_id: Number(e.target.value) || null })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">หมวดหมู่ *</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={draft.qty ?? ''}
          onChange={(e) => setDraft({ qty: Number(e.target.value) || null })}
          placeholder="จำนวน *"
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={draft.unit}
          onChange={(e) => setDraft({ unit: e.target.value })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">หน่วย *</option>
          {units.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <input
        type="number"
        min={0}
        value={draft.target_unit_price ?? ''}
        onChange={(e) => setDraft({ target_unit_price: Number(e.target.value) || undefined })}
        placeholder="ราคาเป้าหมาย"
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
