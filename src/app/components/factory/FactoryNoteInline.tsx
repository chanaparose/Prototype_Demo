/**
 * FactoryNoteInline
 * Inline editable factory-only note for a quotation.
 * - Always visible; click "แก้ไข" to enter edit mode.
 * - Saves via PATCH /quotations/:id  (factory_note field).
 * - Customers never see factory_note — it is omitted from customer-facing APIs.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { quotationsApi } from '@/services/api/rfqApi';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/apiError';

interface Props {
  quotationId: string | number;
  /** Initial value from server */
  initialNote?: string | null;
  /** react-query cache keys to invalidate after save */
  invalidateKeys?: unknown[][];
  /** Called after a successful save — use to reload manual state pages */
  onSaved?: () => void | Promise<void>;
  /** Extra Tailwind classes for outer wrapper */
  className?: string;
}

export function FactoryNoteInline({
  quotationId,
  initialNote,
  invalidateKeys,
  onSaved,
  className = '',
}: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when parent re-fetches data
  useEffect(() => {
    if (!editing) setDraft(initialNote ?? '');
  }, [initialNote, editing]);

  // Auto-focus textarea on enter edit
  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await quotationsApi.patchFactoryNote(quotationId, draft.trim() || null);
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map((key) => qc.invalidateQueries({ queryKey: key })),
        );
      }
      await onSaved?.();
      setEditing(false);
    } catch (e) {
      setError(getErrorMessage(e, 'บันทึกไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(initialNote ?? '');
    setEditing(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') handleCancel();
    // Ctrl+Enter / Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void handleSave();
  };

  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50/60 overflow-hidden ${className}`}>
      {/* Header row */}
      <div className='flex items-center gap-2 px-4 py-2.5 border-b border-amber-100'>
        <span className='text-[11px] font-semibold uppercase tracking-wide text-amber-700 flex-1'>
          🔒 Note (สำหรับโรงงานเท่านั้น)
        </span>
        {!editing ? (
          <button
            type='button'
            onClick={() => setEditing(true)}
            className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors'
          >
            <Pencil size={11} />
            แก้ไข
          </button>
        ) : (
          <div className='flex gap-1'>
            <button
              type='button'
              onClick={() => void handleSave()}
              disabled={saving}
              className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 transition-colors'
            >
              <Check size={11} />
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button
              type='button'
              onClick={handleCancel}
              disabled={saving}
              className='inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-amber-100 disabled:opacity-60 transition-colors'
            >
              <X size={11} />
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className='px-4 py-3'>
        {editing ? (
          <>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder='เช่น ต้องสั่งวัตถุดิบพิเศษ, ต้องประสานงานแผนก… (Ctrl+Enter เพื่อบันทึก)'
              className='w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none'
            />
            {error ? <p className='mt-1 text-xs text-red-600'>{error}</p> : null}
          </>
        ) : draft.trim() ? (
          <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed'>{draft}</p>
        ) : (
          <p className='text-sm text-slate-400 italic'>ยังไม่มี note — กด "แก้ไข" เพื่อเพิ่ม</p>
        )}
      </div>
    </div>
  );
}
