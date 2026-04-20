import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  isDirty: boolean;
  changeCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function ProfileSaveBar({ isDirty, changeCount, saving, onSave, onDiscard }: Props) {
  if (!isDirty && !saving) return null;
  return (
    <div
      role="region"
      aria-label="แถบบันทึกการเปลี่ยนแปลง"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            มีการเปลี่ยนแปลง {changeCount > 0 ? `${changeCount} จุด` : ''}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={14} /> ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            <Check size={14} /> {saving ? 'กำลังบันทึก…' : 'บันทึกทั้งหมด'}
          </button>
        </div>
      </div>
    </div>
  );
}
