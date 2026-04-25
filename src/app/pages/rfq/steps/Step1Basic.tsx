import React from 'react';
import type { RFQDraft } from '../useRFQDraft';

type SubCategory = {
  id: number;
  name: string;
  sortOrder?: number;
};

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
  categories: { id: number; name: string }[];
  subCategories: SubCategory[];
  subCategoriesLoading?: boolean;
};

export function Step1Basic({
  draft,
  setDraft,
  categories,
  subCategories,
  subCategoriesLoading = false,
}: Props) {
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
          onChange={(e) =>
            setDraft({
              category_id: Number(e.target.value) || null,
              sub_category_id: undefined,
            })
          }
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">หมวดหมู่ *</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={draft.sub_category_id ?? ''}
          onChange={(e) => setDraft({ sub_category_id: Number(e.target.value) || undefined })}
          disabled={!draft.category_id || subCategoriesLoading}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100"
        >
          <option value="">
            {subCategoriesLoading ? 'กำลังโหลดหมวดย่อย...' : 'หมวดย่อย (ไม่บังคับ)'}
          </option>
          {subCategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.sortOrder === 99 ? ' (ส่งทุกโรงงานในหมวดหลัก)' : ''}
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
      </div>
      <input
        type="number"
        min={0}
        value={draft.target_unit_price ?? ''}
        onChange={(e) => setDraft({ target_unit_price: Number(e.target.value) || undefined })}
        placeholder="งบประมาณรวม"
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
