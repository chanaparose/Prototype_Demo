/**
 * FactoryNoteInline
 * Standalone factory-note widget that saves directly to the API.
 * Thin wrapper around FactoryNoteField — uses async-save mode.
 * Saves via PATCH /quotations/:id/factory-note (bypasses quotation lock).
 */
import { useEffect, useState } from 'react';
import { quotationsApi } from '@/services/api/rfqApi';
import { getErrorMessage } from '@/lib/apiError';
import { FactoryNoteField } from '@/components/factory/FactoryNoteField';

interface Props {
  quotationId: string | number;
  initialNote?: string | null;
  onSaved?: () => void | Promise<void>;
  className?: string;
}

export function FactoryNoteInline({ quotationId, initialNote, onSaved, className }: Props) {
  const [note, setNote] = useState(initialNote ?? '');

  // Sync when parent re-fetches
  useEffect(() => {
    setNote(initialNote ?? '');
  }, [initialNote]);

  const handleAsyncSave = async (v: string) => {
    try {
      await quotationsApi.patchFactoryNote(quotationId, v.trim() || null);
      await onSaved?.();
    } catch (e) {
      throw new Error(getErrorMessage(e, 'บันทึกไม่สำเร็จ'));
    }
  };

  return (
    <FactoryNoteField
      value={note}
      onChange={setNote}
      onAsyncSave={handleAsyncSave}
      className={className}
    />
  );
}
